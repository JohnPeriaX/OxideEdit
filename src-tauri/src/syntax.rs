//! Tree-sitter integration — *scaffold*.
//!
//! The goal here is structural: a `SyntaxProvider` abstraction the editor can
//! query for a document outline / structural nodes, plus a language registry.
//!
//! The real `tree-sitter` + grammar crates are behind the `tree-sitter` cargo
//! feature so the default cross-platform build (Windows/Linux/macOS) does not
//! require compiling C grammars. Enable with:
//!
//! ```ignore
//! cargo build --features tree-sitter
//! ```

use serde::Serialize;

/// A symbol in a document outline (functions, classes, ...).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OutlineSymbol {
    pub name: String,
    pub kind: String,
    pub start_line: usize,
    pub end_line: usize,
}

/// Languages the syntax layer knows how to parse. When the `tree-sitter`
/// feature is on, these map to loaded grammars; otherwise outline() is empty.
pub const SUPPORTED_LANGUAGES: &[&str] = &[
    "typescript", "tsx", "javascript", "rust", "python", "c", "cpp", "json", "markdown",
];

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyntaxInfo {
    pub engine: String,
    pub active: bool,
    pub languages: Vec<String>,
}

/// Report the current syntax engine status to the frontend.
#[tauri::command]
pub fn syntax_info() -> SyntaxInfo {
    SyntaxInfo {
        engine: "tree-sitter".to_string(),
        active: cfg!(feature = "tree-sitter"),
        languages: SUPPORTED_LANGUAGES.iter().map(|s| s.to_string()).collect(),
    }
}

/// Compute a document outline. With the feature disabled this returns an
/// indentation-based heuristic so the UI has something to render; the
/// tree-sitter path replaces this with a real query.
#[tauri::command]
#[allow(unused_variables)]
pub fn outline(language: String, source: String) -> Vec<OutlineSymbol> {
    #[cfg(feature = "tree-sitter")]
    {
        if let Some(symbols) = ts_outline(&language, &source) {
            return symbols;
        }
    }
    heuristic_outline(&source)
}

#[allow(unused_variables)]
fn heuristic_outline(source: &str) -> Vec<OutlineSymbol> {
    let mut out = Vec::new();
    for (i, line) in source.lines().enumerate() {
        let trimmed = line.trim_end();
        let indent = trimmed.len() - trimmed.trim_start().len();
        if indent == 0 && trimmed.chars().any(|c| !c.is_whitespace()) {
            // Top-level declarations are a decent proxy for an outline.
            let is_decl = ["fn ", "function ", "class ", "const ", "export ", "struct ", "impl ", "interface ", "enum ", "def ", "pub "]
                .iter()
                .any(|kw| trimmed.starts_with(kw));
            if is_decl {
                out.push(OutlineSymbol {
                    name: trimmed.trim_start().to_string(),
                    kind: "declaration".to_string(),
                    start_line: i + 1,
                    end_line: i + 1,
                });
            }
        }
    }
    out
}

// The real grammar-backed implementation lives here when the feature is on.
#[cfg(feature = "tree-sitter")]
#[allow(unused_variables)]
fn ts_outline(language: &str, source: &str) -> Option<Vec<OutlineSymbol>> {
    // Extension point: load the tree-sitter grammar for `language`, parse
    // `source`, and run an S-expression query to extract named symbols.
    // Left unimplemented in the scaffold so enabling the feature compiles.
    None
}
