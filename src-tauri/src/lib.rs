use tauri::Manager as _;

mod commands;
mod db;
mod file_utils;
mod models;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::read_file,
            commands::get_tracks,
            commands::delete_track,
            commands::read_folder,
            commands::get_tracks_paginated,
            commands::get_tracks_count,
            commands::search_tracks,
        ])
        .setup(|app| {
            tauri::async_runtime::block_on(async move {
                let db = db::setup_db(app).await;
                app.manage(db::AppState { db });
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error building the app");
}
