//! Git integration for the Source Control navigator + status bar.
//!
//! Implemented by shelling out to the `git` CLI rather than linking libgit2.
//! Rationale: keeps the default build free of a C toolchain requirement on
//! Windows/Linux/macOS, and `git` is already a hard dependency for any real
//! user. This is the same approach CodeEdit uses for many high-level ops.

use serde::Serialize;
use std::process::Command;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitFile {
    /// Path relative to the repo root, e.g. `src/App.tsx`.
    pub path: String,
    /// Porcelain status code, e.g. "M", "A", "??", "D".
    pub status: String,
    /// Staged (index) column.
    pub index_status: char,
    /// Unstaged (worktree) column.
    pub worktree_status: char,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitStatus {
    pub is_repo: bool,
    pub branch: Option<String>,
    /// True if the repo is detached HEAD.
    pub detached: bool,
    pub changed_files: Vec<GitFile>,
    pub ahead: usize,
    pub behind: usize,
}

fn run_git(cwd: &str, args: &[&str]) -> Result<Option<String>, String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(cwd)
        .output()
        .map_err(|e| format!("failed to run git: {e}"))?;
    if output.status.success() {
        Ok(Some(String::from_utf8_lossy(&output.stdout).to_string()))
    } else {
        Ok(None)
    }
}

/// Compute the full working-tree status for the repository containing `cwd`.
#[tauri::command]
pub fn git_status(cwd: String) -> Result<GitStatus, String> {
    let inside = run_git(&cwd, &["rev-parse", "--is-inside-work-tree"])?;
    if inside.as_deref().map(|s| s.trim()) != Some("true") {
        return Ok(GitStatus {
            is_repo: false,
            branch: None,
            detached: false,
            changed_files: Vec::new(),
            ahead: 0,
            behind: 0,
        });
    }

    let branch = run_git(&cwd, &["rev-parse", "--abbrev-ref", "HEAD"])?
        .map(|s| s.trim().to_string());
    let detached = branch.as_deref() == Some("HEAD");

    let porcelain = run_git(&cwd, &["status", "--porcelain=v1", "--branch"])?
        .unwrap_or_default();

    let mut ahead = 0usize;
    let mut behind = 0usize;
    let mut changed_files = Vec::new();

    for line in porcelain.lines() {
        if let Some(rest) = line.strip_prefix("## ") {
            // Branch header, e.g. "## main...origin/main [ahead 1, behind 2]"
            if let Some(bracket) = rest.rfind('[') {
                let inner = &rest[bracket + 1..rest.rfind(']').unwrap_or(rest.len())];
                for part in inner.split(',') {
                    let part = part.trim();
                    if let Some(n) = part.strip_prefix("ahead ") {
                        ahead = n.trim().parse().unwrap_or(0);
                    } else if let Some(n) = part.strip_prefix("behind ") {
                        behind = n.trim().parse().unwrap_or(0);
                    }
                }
            }
            continue;
        }
        if line.len() < 4 {
            continue;
        }
        let index_status = line.as_bytes()[0] as char;
        let worktree_status = line.as_bytes()[1] as char;
        let path = line[3..].trim().to_string();
        changed_files.push(GitFile {
            status: format!("{index_status}{worktree_status}"),
            path,
            index_status,
            worktree_status,
        });
    }

    Ok(GitStatus {
        is_repo: true,
        branch,
        detached,
        changed_files,
        ahead,
        behind,
    })
}

/// Return the diff of a single file vs HEAD (for a future diff editor).
#[tauri::command]
pub fn git_diff(cwd: String, path: String) -> Result<String, String> {
    Ok(run_git(&cwd, &["diff", "HEAD", "--", &path])?.unwrap_or_default())
}
