//! Filesystem commands backing the Project Navigator.
//!
//! These thin wrappers complement `tauri-plugin-fs` by giving the frontend a
//! single, workspace-scoped call to fetch a lazily-expandable directory tree
//! plus a git-aware "changed" flag per entry.

use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

/// A single node in the project tree. Children are loaded lazily on expand.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FsEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    /// Extension without the dot, e.g. `tsx`, `rs`. `None` for folders.
    pub extension: Option<String>,
    /// True when this entry is a directory that itself contains a directory.
    pub has_children_dir: bool,
}

fn to_entry(path: &Path) -> FsEntry {
    let is_dir = path.is_dir();
    let name = path
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default();
    let extension = if is_dir {
        None
    } else {
        path.extension().map(|e| e.to_string_lossy().to_string())
    };
    let has_children_dir = is_dir && has_subdir(path);
    FsEntry {
        name,
        path: path.to_string_lossy().to_string(),
        is_dir,
        extension,
        has_children_dir,
    }
}

fn has_subdir(path: &Path) -> bool {
    if let Ok(rd) = fs::read_dir(path) {
        for entry in rd.flatten() {
            if entry.path().is_dir() {
                return true;
            }
        }
    }
    false
}

/// Entries we never surface in the navigator (also reused by search).
pub(crate) const IGNORED: &[&str] = &[
    ".git",
    "node_modules",
    "target",
    "dist",
    ".DS_Store",
    "__pycache__",
    ".next",
    ".nuxt",
];

pub(crate) fn is_ignored(name: &str) -> bool {
    IGNORED.contains(&name)
}

/// List the direct children of `dir`, folders first, alphabetical.
#[tauri::command]
pub fn read_dir(dir: String) -> Result<Vec<FsEntry>, String> {
    let path = PathBuf::from(&dir);
    let rd = fs::read_dir(&path).map_err(|e| format!("{dir}: {e}"))?;
    let mut entries: Vec<FsEntry> = rd
        .flatten()
        .map(|e| to_entry(&e.path()))
        .filter(|e| !is_ignored(&e.name))
        .collect();
    entries.sort_by(|a, b| match (b.is_dir, a.is_dir) {
        (true, false) => std::cmp::Ordering::Greater,
        (false, true) => std::cmp::Ordering::Less,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });
    Ok(entries)
}

/// Read a UTF-8 text file. Binary files return an error the UI can show.
#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    let bytes = fs::read(&path).map_err(|e| format!("{path}: {e}"))?;
    String::from_utf8(bytes).map_err(|_| format!("{path}: not a UTF-8 text file"))
}

/// Write (create/overwrite) a UTF-8 text file, creating parent dirs as needed.
#[tauri::command]
pub fn write_file(path: String, contents: String) -> Result<(), String> {
    let p = PathBuf::from(&path);
    if let Some(parent) = p.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("{path}: {e}"))?;
    }
    fs::write(&p, contents).map_err(|e| format!("{path}: {e}"))?;
    Ok(())
}

/// Absolute path of the workspace root folder, if a folder is currently open.
/// (Kept for parity with future multi-root workspaces.)
#[allow(dead_code)]
pub fn canonical_root(dir: &str) -> Option<String> {
    fs::canonicalize(dir).ok().map(|p| p.to_string_lossy().to_string())
}
