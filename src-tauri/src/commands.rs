use crate::db::AppState;
use crate::file_utils::{collect_audio_files, path_to_db};
use crate::models::Track;
use futures::TryStreamExt;
use serde::Serialize;
use std::path::Path;
use tauri::{AppHandle, Emitter};

#[derive(Clone, Serialize)]
struct ProgressPayload {
    progress: f64,
    file_name: String,
}

#[tauri::command]
pub async fn read_file(state: tauri::State<'_, AppState>, path_str: &str) -> Result<(), String> {
    path_to_db(path_str, &state.db).await
}

#[tauri::command]
pub async fn read_folder(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
    path_str: &str,
) -> Result<String, String> {
    let db = &state.db;
    let success_string = String::from("No errors occurred while reading the folder.\n");
    let mut error_string = String::new();

    let path = Path::new(path_str);
    if !path.is_dir() {
        return Err("Not a directory".to_string());
    }

    let audio_extensions = [".mp3", ".flac", ".wav", ".ogg", ".m4a", ".aac", ".wma"];
    let mut audio_files = Vec::new();

    collect_audio_files(path, &audio_extensions, &mut audio_files)?;
    let total_files = audio_files.len();

    for (i, file_path) in audio_files.into_iter().enumerate() {
        if let Err(e) = path_to_db(&file_path, db).await {
            error_string.push_str(&format!("Failed to add file '{file_path}': {e}\n"));
        }

        let progress = (i + 1) as f64 / total_files as f64 * 100.0;
        let file_name = Path::new(&file_path)
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        if let Err(e) = app.emit(
            "progress",
            ProgressPayload {
                progress,
                file_name,
            },
        ) {
            eprintln!("Failed to emit progress event: {e}");
        }
    }

    if !error_string.is_empty() {
        Err(error_string)
    } else {
        Ok(success_string)
    }
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
