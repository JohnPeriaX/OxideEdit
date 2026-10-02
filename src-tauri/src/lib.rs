mod fs;
mod git;
mod lsp;
mod search;
mod syntax;
mod term;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(term::Terminals::default())
        .manage(lsp::LspClients::default())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            fs::read_dir,
            fs::read_file,
            fs::write_file,
            search::workspace_search,
            git::git_status,
            git::git_diff,
            term::pty_create,
            term::pty_write,
            term::pty_resize,
            term::pty_kill,
            lsp::lsp_registry,
            lsp::lsp_start,
            lsp::lsp_did_open,
            lsp::lsp_did_change,
            lsp::lsp_send,
            lsp::lsp_stop,
            syntax::syntax_info,
            syntax::outline,
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
