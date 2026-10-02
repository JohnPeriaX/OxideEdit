//! Language Server Protocol client.
//!
//! A real (if minimal) stdio LSP client: spawn a server, run the
//! `initialize` / `initialized` handshake, open documents, and pump
//! `textDocument/publishDiagnostics` notifications back to the webview as
//! `lsp-diagnostics` events. Monaco turns those into squiggles + the Problems
//! count.
//!
//! The message-parsing logic is kept in pure functions so it can be unit
//! tested without a running server (see the `tests` module).

use serde::Serialize;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter};

/// A known language server and how to launch it.
#[derive(Debug, Clone)]
pub struct ServerSpec {
    pub id: &'static str,
    pub languages: &'static [&'static str],
    pub program: &'static str,
    pub args: &'static [&'static str],
}

pub const KNOWN_SERVERS: &[ServerSpec] = &[
    ServerSpec {
        id: "rust-analyzer",
        languages: &["rust"],
        program: "rust-analyzer",
        args: &[],
    },
    ServerSpec {
        id: "typescript",
        languages: &["typescript", "javascript", "typescriptreact", "javascriptreact"],
        program: "typescript-language-server",
        args: &["--stdio"],
    },
    ServerSpec {
        id: "pyright",
        languages: &["python"],
        program: "pyright-langserver",
        args: &["--stdio"],
    },
    ServerSpec {
        id: "clangd",
        languages: &["c", "cpp"],
        program: "clangd",
        args: &["--stdio"],
    },
];

fn spec_for(server_id: &str) -> Option<ServerSpec> {
    KNOWN_SERVERS.iter().find(|s| s.id == server_id).cloned()
}

/// Map a Monaco language id to a configured server id.
pub fn server_for_language(language: &str) -> Option<&'static str> {
    KNOWN_SERVERS
        .iter()
        .find(|s| s.languages.contains(&language))
        .map(|s| s.id)
}

// ---- Wire types returned to the frontend ----------------------------------

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LspDiagnostic {
    pub start_line: u32,
    pub start_char: u32,
    pub end_line: u32,
    pub end_char: u32,
    /// LSP severity: 1=Error, 2=Warning, 3=Info, 4=Hint.
    pub severity: u32,
    pub message: String,
    pub source: Option<String>,
    pub code: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticsPayload {
    pub server: String,
    pub uri: String,
    pub diagnostics: Vec<LspDiagnostic>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LspInfo {
    pub id: String,
    pub server: String,
    pub installed: bool,
}

// ---- Base protocol framing (also used by tests) ---------------------------

pub fn encode_frame(value: &Value) -> Vec<u8> {
    let body = serde_json::to_vec(value).unwrap_or_default();
    let header = format!("Content-Length: {}\r\n\r\n", body.len());
    let mut out = Vec::with_capacity(header.len() + body.len());
    out.extend_from_slice(header.as_bytes());
    out.extend_from_slice(&body);
    out
}

pub fn read_frame<R: BufRead>(reader: &mut R) -> std::io::Result<Option<Value>> {
    let mut content_length: Option<usize> = None;
    loop {
        let mut header = String::new();
        let n = reader.read_line(&mut header)?;
        if n == 0 {
            return Ok(None); // EOF
        }
        let line = header.trim_end();
        if line.is_empty() {
            break; // end of headers
        }
        if let Some(v) = line
            .strip_prefix("Content-Length:")
            .or_else(|| line.strip_prefix("content-length:"))
        {
            content_length = v.trim().parse().ok();
        }
    }
    let len = content_length.ok_or_else(|| {
        std::io::Error::new(std::io::ErrorKind::InvalidData, "missing Content-Length")
    })?;
    let mut buf = vec![0u8; len];
    reader.read_exact(&mut buf)?;
    let value: Value =
        serde_json::from_slice(&buf).map_err(std::io::Error::other)?;
    Ok(Some(value))
}

/// Convert a `textDocument/publishDiagnostics` notification into our payload.
/// Returns `None` for any other method or a malformed body.
pub fn parse_publish_diagnostics(
    server: &str,
    method: &str,
    msg: &Value,
) -> Option<DiagnosticsPayload> {
    if method != "textDocument/publishDiagnostics" {
        return None;
    }
    let params = msg.get("params")?;
    let uri = params.get("uri")?.as_str()?.to_string();
    let list = params.get("diagnostics")?.as_array()?;

    let diagnostics = list
        .iter()
        .filter_map(|d| {
            let range = d.get("range")?;
            let start = range.get("start")?;
            let end = range.get("end")?;
            let message = d.get("message")?.as_str()?.to_string();
            let code = d.get("code").and_then(|c| match c {
                Value::String(s) => Some(s.clone()),
                Value::Number(n) => Some(n.to_string()),
                _ => None,
            });
            Some(LspDiagnostic {
                start_line: start.get("line")?.as_u64()? as u32,
                start_char: start.get("character")?.as_u64()? as u32,
                end_line: end.get("line")?.as_u64()? as u32,
                end_char: end.get("character")?.as_u64()? as u32,
                severity: d.get("severity").and_then(|s| s.as_u64()).unwrap_or(1) as u32,
                message,
                source: d.get("source").and_then(|s| s.as_str()).map(String::from),
                code,
            })
        })
        .collect();

    Some(DiagnosticsPayload {
        server: server.to_string(),
        uri,
        diagnostics,
    })
}

// ---- Running connection ---------------------------------------------------

struct Running {
    stdin: Box<dyn Write + Send>,
    child: Child,
    next_id: i64,
}

/// Managed map of `serverId -> connection`.
pub struct LspClients(Mutex<HashMap<String, Mutex<Running>>>);

impl Default for LspClients {
    fn default() -> Self {
        LspClients(Mutex::new(HashMap::new()))
    }
}

fn program_on_path(program: &str) -> bool {
    // Cheap availability probe without spawning the server.
    let probe = if cfg!(windows) { "where" } else { "which" };
    Command::new(probe)
        .arg(program)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .map(|s| s.success())
        .unwrap_or(false)
}

/// List configured servers and whether each binary is installed.
#[tauri::command]
pub fn lsp_registry() -> Vec<LspInfo> {
    KNOWN_SERVERS
        .iter()
        .map(|s| LspInfo {
            id: s.id.to_string(),
            server: format!("{} ({})", s.program, s.languages.join(", ")),
            installed: program_on_path(s.program),
        })
        .collect()
}

/// Spawn a server and run the initialize/initialized handshake. A background
/// reader thread then forwards diagnostics notifications to the webview.
#[tauri::command]
pub fn lsp_start(
    app: AppHandle,
    state: tauri::State<'_, LspClients>,
    server_id: String,
    root_uri: String,
) -> Result<String, String> {
    if state.0.lock().unwrap().contains_key(&server_id) {
        return Ok(server_id); // already running
    }
    let spec = spec_for(&server_id).ok_or_else(|| format!("unknown server: {server_id}"))?;

    let mut child = Command::new(spec.program)
        .args(spec.args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("failed to launch {}: {e}", spec.program))?;

    let stdin = child.stdin.take().ok_or("no stdin")?;
    let stdout = child.stdout.take().ok_or("no stdout")?;
    let mut stdin: Box<dyn Write + Send> = Box::new(stdin);

    // initialize
    let init = json!({
        "jsonrpc": "2.0", "id": 1, "method": "initialize",
        "params": {
            "processId": std::process::id(),
            "clientInfo": { "name": "OxideEdit", "version": "0.1.0" },
            "rootUri": root_uri,
            "capabilities": {
                "textDocument": {
                    "publishDiagnostics": { "relatedInformation": true },
                    "sync": { "dynamicRegistration": false }
                },
                "workspace": { "configuration": false }
            }
        }
    });
    stdin
        .write_all(&encode_frame(&init))
        .map_err(|e| e.to_string())?;
    stdin.flush().map_err(|e| e.to_string())?;

    // Wait for the initialize response, then send `initialized`.
    let mut reader = BufReader::new(stdout);
    match read_frame(&mut reader) {
        Ok(Some(v)) => log::info!("[lsp:{server_id}] initialize ok: {}", v.get("result").is_some()),
        Ok(None) => return Err("server closed during initialize".into()),
        Err(e) => return Err(format!("initialize read failed: {e}")),
    }
    let initialized = json!({ "jsonrpc": "2.0", "method": "initialized", "params": {} });
    stdin
        .write_all(&encode_frame(&initialized))
        .map_err(|e| e.to_string())?;
    stdin.flush().map_err(|e| e.to_string())?;

    // Reader thread: forward notifications to the webview.
    let srv = server_id.clone();
    std::thread::spawn(move || {
        loop {
            match read_frame(&mut reader) {
                Ok(Some(msg)) => {
                    if let Some(method) = msg.get("method").and_then(|m| m.as_str()) {
                        if let Some(payload) = parse_publish_diagnostics(&srv, method, &msg) {
                            let _ = app.emit("lsp-diagnostics", payload);
                        }
                    }
                }
                Ok(None) => break,
                Err(_) => break,
            }
        }
        log::info!("[lsp:{srv}] reader loop ended");
    });

    state.0.lock().unwrap().insert(
        server_id.clone(),
        Mutex::new(Running {
            stdin,
            child,
            next_id: 2,
        }),
    );
    Ok(server_id)
}

fn send_notification(state: &LspClients, server_id: &str, method: &str, params: Value) -> Result<(), String> {
    let map = state.0.lock().map_err(|_| "poisoned")?;
    let running = map
        .get(server_id)
        .ok_or_else(|| format!("server not running: {server_id}"))?;
    let mut conn = running.lock().map_err(|_| "poisoned")?;
    let msg = json!({ "jsonrpc": "2.0", "method": method, "params": params });
    conn.stdin
        .write_all(&encode_frame(&msg))
        .map_err(|e| e.to_string())?;
    conn.stdin.flush().map_err(|e| e.to_string())?;
    Ok(())
}

/// Tell the server a document was opened (full text).
#[tauri::command]
pub fn lsp_did_open(
    state: tauri::State<'_, LspClients>,
    server_id: String,
    uri: String,
    language_id: String,
    text: String,
) -> Result<(), String> {
    let params = json!({
        "textDocument": { "uri": uri, "languageId": language_id, "version": 1, "text": text }
    });
    send_notification(&state, &server_id, "textDocument/didOpen", params)
}

/// Tell the server a document's content changed (full sync).
#[tauri::command]
pub fn lsp_did_change(
    state: tauri::State<'_, LspClients>,
    server_id: String,
    uri: String,
    version: i64,
    text: String,
) -> Result<(), String> {
    let params = json!({
        "textDocument": { "uri": uri, "version": version },
        "contentChanges": [ { "text": text } ]
    });
    send_notification(&state, &server_id, "textDocument/didChange", params)
}

/// Send a raw request (advanced/manual use). Returns the assigned id.
#[tauri::command]
pub fn lsp_send(
    state: tauri::State<'_, LspClients>,
    server_id: String,
    method: String,
    params: Value,
) -> Result<i64, String> {
    let map = state.0.lock().map_err(|_| "poisoned")?;
    let running = map
        .get(&server_id)
        .ok_or_else(|| format!("server not running: {server_id}"))?;
    let mut conn = running.lock().map_err(|_| "poisoned")?;
    let id = conn.next_id;
    conn.next_id += 1;
    let msg = json!({ "jsonrpc": "2.0", "id": id, "method": method, "params": params });
    conn.stdin
        .write_all(&encode_frame(&msg))
        .map_err(|e| e.to_string())?;
    conn.stdin.flush().map_err(|e| e.to_string())?;
    Ok(id)
}

/// Shut down a server.
#[tauri::command]
pub fn lsp_stop(state: tauri::State<'_, LspClients>, server_id: String) -> Result<(), String> {
    let mut map = state.0.lock().map_err(|_| "poisoned")?;
    if let Some(running) = map.remove(&server_id) {
        let mut conn = running.lock().map_err(|_| "poisoned")?;
        let _ = conn.child.kill();
        let _ = conn.child.wait();
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;
    use std::process::Stdio;
    use std::sync::mpsc;
    use std::time::Duration;

    #[test]
    fn framing_round_trip() {
        let msg = json!({ "jsonrpc": "2.0", "id": 1, "result": { "ok": true } });
        let bytes = encode_frame(&msg);
        let mut reader = BufReader::new(Cursor::new(bytes));
        let back = read_frame(&mut reader).unwrap().unwrap();
        assert_eq!(back["id"], 1);
        assert_eq!(back["result"]["ok"], true);
        // Stream is now exhausted.
        assert!(read_frame(&mut reader).unwrap().is_none());
    }

    #[test]
    fn parses_publish_diagnostics() {
        let notification = json!({
            "jsonrpc": "2.0",
            "method": "textDocument/publishDiagnostics",
            "params": {
                "uri": "file:///src/main.rs",
                "diagnostics": [
                    {
                        "range": { "start": { "line": 9, "character": 4 }, "end": { "line": 9, "character": 12 } },
                        "severity": 1,
                        "source": "rustc",
                        "code": "E0308",
                        "message": "mismatched types"
                    },
                    {
                        "range": { "start": { "line": 0, "character": 0 }, "end": { "line": 0, "character": 1 } },
                        "message": "unused variable: `x`" // no severity -> defaults to Error(1)
                    }
                ]
            }
        });

        let payload =
            parse_publish_diagnostics("rust-analyzer", "textDocument/publishDiagnostics", &notification)
                .expect("should parse");
        assert_eq!(payload.uri, "file:///src/main.rs");
        assert_eq!(payload.diagnostics.len(), 2);

        let d0 = &payload.diagnostics[0];
        assert_eq!((d0.start_line, d0.start_char, d0.end_line, d0.end_char), (9, 4, 9, 12));
        assert_eq!(d0.severity, 1);
        assert_eq!(d0.source.as_deref(), Some("rustc"));
        assert_eq!(d0.code.as_deref(), Some("E0308"));
        assert_eq!(d0.message, "mismatched types");

        // Missing severity defaults to 1 (Error); missing code/source become None.
        let d1 = &payload.diagnostics[1];
        assert_eq!(d1.severity, 1);
        assert!(d1.code.is_none() && d1.source.is_none());

        // Non-diagnostics methods return None.
        let other = json!({ "method": "window/logMessage", "params": {} });
        assert!(parse_publish_diagnostics("x", "window/logMessage", &other).is_none());
    }

    /// Live proof against a real language server (skipped unless the binary is
    /// present). Run explicitly with:  cargo test -- --ignored lsp_handshake
    #[test]
    #[ignore]
    fn lsp_handshake_with_rust_analyzer() {
        if !program_on_path("rust-analyzer") {
            eprintln!("rust-analyzer not installed; skipping");
            return;
        }
        let child = Command::new("rust-analyzer")
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
            .expect("spawn rust-analyzer");
        let mut child = child;
        let mut stdin = child.stdin.take().unwrap();
        let stdout = child.stdout.take().unwrap();

        let init = json!({
            "jsonrpc": "2.0", "id": 1, "method": "initialize",
            "params": { "processId": null, "rootUri": null, "capabilities": {} }
        });
        stdin.write_all(&encode_frame(&init)).unwrap();
        stdin.flush().unwrap();

        let (tx, rx) = mpsc::channel();
        std::thread::spawn(move || {
            let mut r = BufReader::new(stdout);
            if let Ok(Some(v)) = read_frame(&mut r) {
                let _ = tx.send(v);
            }
        });

        let resp = rx
            .recv_timeout(Duration::from_secs(30))
            .expect("no initialize response within 30s");
        assert_eq!(resp["id"], 1, "response should echo request id");
        assert!(
            resp["result"]["capabilities"].is_object(),
            "server must advertise capabilities"
        );
        let _ = child.kill();
        let _ = child.wait();
    }
}
