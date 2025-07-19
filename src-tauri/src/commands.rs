use crate::db::AppState;
use crate::file_utils::{collect_audio_files, path_to_db};
use crate::models::Track;
use futures::TryStreamExt;
use std::path::Path;

#[tauri::command]
pub async fn read_file(state: tauri::State<'_, AppState>, path_str: &str) -> Result<(), String> {
    path_to_db(path_str, &state.db).await
}

#[tauri::command]
pub async fn read_folder(state: tauri::State<'_, AppState>, path_str: &str) -> Result<(), String> {
    let db = &state.db;

    let path = Path::new(path_str);
    if !path.is_dir() {
        return Err("Not a directory".to_string());
    }

    let audio_extensions = [".mp3", ".flac", ".wav", ".ogg", ".m4a", ".aac", ".wma"];
    let mut audio_files = Vec::new();

    collect_audio_files(path, &audio_extensions, &mut audio_files)?;
    for file_path in audio_files {
        if let Err(e) = path_to_db(&file_path, db).await {
            eprintln!("Failed to add file '{file_path}': {e}");
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn get_tracks(state: tauri::State<'_, AppState>) -> Result<Vec<Track>, String> {
    let db = &state.db;

    let tracks: Vec<Track> = sqlx::query_as::<_, Track>("SELECT * FROM tracks")
        .fetch(db)
        .try_collect()
        .await
        .map_err(|e| format!("Failed to get tracks {e}"))?;

    Ok(tracks)
}

#[tauri::command]
pub async fn delete_track(state: tauri::State<'_, AppState>, id: u16) -> Result<(), String> {
    let db = &state.db;

    sqlx::query("DELETE FROM tracks WHERE id = ?1")
        .bind(id)
        .execute(db)
        .await
        .map_err(|e| format!("could not delete track {e}"))?;

    Ok(())
}
