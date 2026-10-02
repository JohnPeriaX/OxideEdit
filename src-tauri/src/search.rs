//! Workspace-wide literal text search backing the Find Navigator.
//!
//! Deliberately dependency-free (std only): walks the tree, skips ignored
//! directories and binary/oversized files, and returns matches grouped per
//! file with 1-based line/column and a trimmed preview. Case sensitivity and
//! whole-word matching are supported; regex is intentionally out of scope to
//! keep the default build light and cross-platform.

use crate::fs::is_ignored;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchOptions {
    #[serde(default)]
    pub case_sensitive: bool,
    #[serde(default)]
    pub whole_word: bool,
    /// Max number of files to report.
    #[serde(default = "default_max_files")]
    pub max_files: usize,
}

fn default_max_files() -> usize {
    100
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LineMatch {
    pub line: usize,
    pub column: usize,
    pub preview: String,
    /// Byte length of the matched text, for highlighting in the UI.
    pub match_len: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileMatch {
    pub path: String,
    pub name: String,
    pub relative: String,
    pub matches: Vec<LineMatch>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResults {
    pub query: String,
    pub files: Vec<FileMatch>,
    pub total_matches: usize,
    pub truncated: bool,
}

/// Extensions treated as binary/asset — never scanned as text.
const BINARY_EXT: &[&str] = &[
    "png", "jpg", "jpeg", "gif", "bmp", "ico", "icns", "webp", "pdf", "zip", "gz", "tar", "woff",
    "woff2", "ttf", "otf", "eot", "mp3", "mp4", "mov", "avi", "so", "dll", "dylib", "exe", "bin",
    "class", "jar", "wasm",
];

fn is_binary_name(path: &Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| BINARY_EXT.contains(&e.to_lowercase().as_str()))
        .unwrap_or(false)
}

fn char_column(line: &str, byte_idx: usize) -> usize {
    // 1-based column measured in characters, not bytes.
    line[..byte_idx].chars().count() + 1
}

fn find_in_line(
    line: &str,
    needle: &str,
    opts: &SearchOptions,
    line_no: usize,
    out: &mut Vec<LineMatch>,
) {
    let hay: String = if opts.case_sensitive {
        line.to_string()
    } else {
        line.to_lowercase()
    };
    let ndl: String = if opts.case_sensitive {
        needle.to_string()
    } else {
        needle.to_lowercase()
    };

    let bytes = hay.as_bytes();
    let mut start = 0usize;
    while let Some(pos) = find_subslice(bytes, ndl.as_bytes(), start) {
        let end = pos + ndl.len();
        if opts.whole_word {
            let before_ok = pos == 0 || !is_word_byte(bytes[pos - 1]);
            let after_ok = end >= bytes.len() || !is_word_byte(bytes[end]);
            if !(before_ok && after_ok) {
                start = end;
                continue;
            }
        }
        out.push(LineMatch {
            line: line_no,
            column: char_column(line, pos),
            preview: line.trim().to_string(),
            match_len: ndl.chars().count(),
        });
        start = end;
    }
}

fn is_word_byte(b: u8) -> bool {
    b.is_ascii_alphanumeric() || b == b'_'
}

/// Simple subslice search returning the byte offset of `needle` in `haystack`.
fn find_subslice(haystack: &[u8], needle: &[u8], from: usize) -> Option<usize> {
    if needle.is_empty() || haystack.len() < from + needle.len() {
        return None;
    }
    haystack[from..]
        .windows(needle.len())
        .position(|w| w == needle)
        .map(|p| p + from)
}

fn walk(dir: &Path, root: &Path, query: &str, opts: &SearchOptions, results: &mut SearchResults) -> bool {
    let rd = match fs::read_dir(dir) {
        Ok(rd) => rd,
        Err(_) => return false,
    };
    let mut entries: Vec<PathBuf> = rd.flatten().map(|e| e.path()).collect();
    entries.sort();

    for path in entries {
        let name = path
            .file_name()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default();
        if is_ignored(&name) {
            continue;
        }
        if path.is_dir() {
            if walk(&path, root, query, opts, results) {
                return true; // stop signal (limit reached)
            }
            continue;
        }
        if is_binary_name(&path) {
            continue;
        }
        // Skip oversized files (>2 MB) to stay responsive.
        if let Ok(meta) = path.metadata() {
            if meta.len() > 2_000_000 {
                continue;
            }
        }
        let contents = match fs::read_to_string(&path) {
            Ok(c) => c,
            Err(_) => continue, // non-UTF8 / read error
        };

        let mut matches = Vec::new();
        for (i, line) in contents.lines().enumerate() {
            find_in_line(line, query, opts, i + 1, &mut matches);
        }
        if matches.is_empty() {
            continue;
        }

        results.total_matches += matches.len();
        let relative = path
            .strip_prefix(root)
            .unwrap_or(&path)
            .to_string_lossy()
            .replace('\\', "/");
        results.files.push(FileMatch {
            path: path.to_string_lossy().to_string(),
            name,
            relative,
            matches,
        });

        if results.files.len() >= opts.max_files {
            results.truncated = true;
            return true;
        }
    }
    false
}

/// Search all text files under `root` for the literal `query`.
#[tauri::command]
pub fn workspace_search(
    root: String,
    query: String,
    options: SearchOptions,
) -> Result<SearchResults, String> {
    if query.is_empty() {
        return Ok(SearchResults {
            query,
            files: Vec::new(),
            total_matches: 0,
            truncated: false,
        });
    }
    let root_path = PathBuf::from(&root);
    if !root_path.is_dir() {
        return Err(format!("not a directory: {root}"));
    }
    let mut results = SearchResults {
        query,
        files: Vec::new(),
        total_matches: 0,
        truncated: false,
    };
    let q = results.query.clone();
    walk(&root_path, &root_path, &q, &options, &mut results);
    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tmpdir(tag: &str) -> PathBuf {
        let mut p = std::env::temp_dir();
        p.push(format!("codeeditx-search-{}-{}", tag, std::process::id()));
        let _ = fs::remove_dir_all(&p);
        fs::create_dir_all(&p).unwrap();
        p
    }

    fn opts(case: bool, word: bool) -> SearchOptions {
        SearchOptions { case_sensitive: case, whole_word: word, max_files: 100 }
    }

    #[test]
    fn case_and_whole_word() {
        let dir = tmpdir("cw");
        fs::write(dir.join("a.txt"), "Foo foo FOOD foobar\nnothing here\nfoo again foo\n").unwrap();

        // case-insensitive, substring: Foo, foo, FOOD, foobar on line 1 (4) + 2 on line 3 = 6
        let r = workspace_search(dir.to_string_lossy().into(), "foo".into(), opts(false, false)).unwrap();
        assert_eq!(r.total_matches, 6, "substring case-insensitive");

        // whole-word, case-insensitive: Foo, foo (line1) + foo, foo (line3) = 4 (FOOD/foobar excluded)
        let r = workspace_search(dir.to_string_lossy().into(), "foo".into(), opts(false, true)).unwrap();
        assert_eq!(r.total_matches, 4, "whole-word case-insensitive");

        // case-sensitive whole-word: only lowercase "foo" -> 1 (line1) + 2 (line3) = 3
        let r = workspace_search(dir.to_string_lossy().into(), "foo".into(), opts(true, true)).unwrap();
        assert_eq!(r.total_matches, 3, "whole-word case-sensitive");

        // column is 1-based char offset of the first match on line 3
        let line3 = r.files[0].matches.iter().find(|m| m.line == 3).unwrap();
        assert_eq!(line3.column, 1);

        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn ignores_dirs_and_binary_files() {
        let dir = tmpdir("ig");
        fs::create_dir_all(dir.join("node_modules")).unwrap();
        fs::write(dir.join("node_modules").join("x.txt"), "needle").unwrap();
        fs::write(dir.join("logo.png"), "needle").unwrap(); // binary ext -> skipped
        fs::write(dir.join("real.txt"), "needle here").unwrap();

        let r = workspace_search(dir.to_string_lossy().into(), "needle".into(), opts(false, false)).unwrap();
        assert_eq!(r.files.len(), 1, "only real.txt should match");
        assert_eq!(r.files[0].name, "real.txt");

        let _ = fs::remove_dir_all(&dir);
    }
}
