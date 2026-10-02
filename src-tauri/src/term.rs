//! Integrated terminal backed by a real cross-platform PTY (`portable-pty`).
//!
//! - Windows  -> ConPTY
//! - Linux    -> openpty / forkpty
//! - macOS    -> openpty / forkpty
//!
//! Each terminal session gets an id. A reader thread pumps raw bytes out to
//! the frontend as `pty-output` events; the frontend feeds them to xterm.js.
//! Input, resize and kill flow back through the commands below.

use portable_pty::{CommandBuilder, NativePtySystem, PtySize, PtySystem};
use serde::Serialize;
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};

/// Managed collection of live terminal sessions.
pub struct Terminals(Mutex<HashMap<String, Terminal>>);

struct Terminal {
    writer: Box<dyn Write + Send>,
    master: Box<dyn portable_pty::MasterPty + Send>,
    child: Box<dyn portable_pty::Child + Send + Sync>,
}

#[derive(Debug, Clone, Serialize)]
struct PtyOutput {
    id: String,
    data: Vec<u8>,
}

#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PtyOptions {
    pub cols: u16,
    pub rows: u16,
    #[serde(default)]
    pub cwd: Option<String>,
    /// Optional program + args; defaults to the user's login shell.
    #[serde(default)]
    pub command: Option<String>,
    #[serde(default)]
    pub args: Vec<String>,
}

impl Default for Terminals {
    fn default() -> Self {
        Terminals(Mutex::new(HashMap::new()))
    }
}

fn default_shell_command(opts: &PtyOptions) -> CommandBuilder {
    let mut cmd = match &opts.command {
        Some(program) => {
            let mut c = CommandBuilder::new(program);
            c.args(&opts.args);
            c
        }
        None => {
            #[cfg(windows)]
            {
                CommandBuilder::new("powershell.exe")
            }
            #[cfg(not(windows))]
            {
                let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string());
                CommandBuilder::new(shell)
            }
        }
    };
    cmd.env("TERM", "xterm-256color");
    if let Some(cwd) = &opts.cwd {
        cmd.cwd(cwd);
    }
    cmd
}

/// Spawn a new PTY-backed shell. Returns the session id.
#[tauri::command]
pub fn pty_create(
    app: AppHandle,
    state: State<'_, Terminals>,
    opts: PtyOptions,
) -> Result<String, String> {
    let pty_system = NativePtySystem::default();
    let size = PtySize {
        rows: opts.rows.max(1),
        cols: opts.cols.max(1),
        pixel_width: 0,
        pixel_height: 0,
    };
    let pair = pty_system
        .openpty(size)
        .map_err(|e| format!("openpty failed: {e}"))?;

    let cmd = default_shell_command(&opts);
    let child = pair
        .slave
        .spawn_command(cmd)
        .map_err(|e| format!("spawn failed: {e}"))?;
    drop(pair.slave);

    let reader = pair
        .master
        .try_clone_reader()
        .map_err(|e| format!("clone reader failed: {e}"))?;
    let writer = pair
        .master
        .take_writer()
        .map_err(|e| format!("take writer failed: {e}"))?;

    let id = uuid::Uuid::new_v4().to_string();
    let master = pair.master;

    // Pump PTY output to the webview.
    let emit_id = id.clone();
    std::thread::spawn(move || {
        let mut reader = reader;
        let mut buf = [0u8; 8192];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    let payload = PtyOutput {
                        id: emit_id.clone(),
                        data: buf[..n].to_vec(),
                    };
                    if app.emit("pty-output", payload).is_err() {
                        break;
                    }
                }
                Err(_) => break,
            }
        }
    });

    state
        .0
        .lock()
        .map_err(|_| "state poisoned")?
        .insert(id.clone(), Terminal { writer, master, child });

    Ok(id)
}

/// Write raw input (keystrokes) from xterm into the shell.
#[tauri::command]
pub fn pty_write(state: State<'_, Terminals>, id: String, data: String) -> Result<(), String> {
    let mut map = state.0.lock().map_err(|_| "state poisoned")?;
    if let Some(term) = map.get_mut(&id) {
        term.writer
            .write_all(data.as_bytes())
            .map_err(|e| e.to_string())?;
        term.writer.flush().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Resize the PTY to match the xterm viewport.
#[tauri::command]
pub fn pty_resize(
    state: State<'_, Terminals>,
    id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let map = state.0.lock().map_err(|_| "state poisoned")?;
    if let Some(term) = map.get(&id) {
        term.master
            .resize(PtySize {
                rows: rows.max(1),
                cols: cols.max(1),
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Terminate a session and reap the child.
#[tauri::command]
pub fn pty_kill(state: State<'_, Terminals>, id: String) -> Result<(), String> {
    let mut map = state.0.lock().map_err(|_| "state poisoned")?;
    if let Some(mut term) = map.remove(&id) {
        let _ = term.child.kill();
        let _ = term.child.wait();
    }
    Ok(())
}
