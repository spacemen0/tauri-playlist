use std::path::Path;

use futures::TryStreamExt;
use lofty::prelude::*;
use lofty::probe::Probe;
use serde::{Deserialize, Serialize};
use sqlx::{
    migrate::{MigrateDatabase, MigrateError},
    prelude::FromRow,
    sqlite::SqlitePoolOptions,
    Pool, Sqlite,
};
use tauri::{App, Manager as _};

type Db = Pool<Sqlite>;

struct AppState {
    db: Db,
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_file,
            get_tracks,
            delete_track,
            read_folder,
        ])
        .setup(|app| {
            tauri::async_runtime::block_on(async move {
                let db = setup_db(&app).await;
                app.manage(AppState { db });
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error building the app");
}

async fn setup_db(app: &App) -> Db {
    let mut path = app.path().app_data_dir().expect("failed to get data_dir");

    std::fs::create_dir_all(&path).expect("Failed to create app data directory");

    path.push("db.sqlite");

    // Creates the database file if it doesn't exist
    Sqlite::create_database(&format!("sqlite:{}", path.to_str().unwrap()))
        .await
        .expect("Failed to create database");

    let db_url = format!("sqlite://{}", path.to_str().unwrap());

    let db = SqlitePoolOptions::new()
        .connect(&db_url)
        .await
        .expect("Failed to connect to database");

    match sqlx::migrate!("./migrations").run(&db).await {
        Ok(_) => {
            println!("Database migrations applied successfully.");
        }
        Err(MigrateError::VersionMismatch(version)) => {
            eprintln!("Migration version mismatch detected: {:?}.", version);
            eprintln!("Clearing migration records in the database to re-align...");

            // Clear migration records without dropping tables
            sqlx::query("DELETE FROM _sqlx_migrations;")
                .execute(&db)
                .await
                .expect("Failed to clear migration records");
            sqlx::migrate!("./migrations")
                .run(&db)
                .await
                .expect("Migration failed after clearing migration records");

            println!("Migration records cleared and migrations reapplied successfully.");
        }
        Err(e) => {
            panic!("Migration failed: {e:?}");
        }
    }

    db
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
struct Track {
    id: u16,
    length: u16,
    title: String,
    artist: String,
    album: String,
    genre: String,
    path: String,
}

fn collect_audio_files(
    dir_path: &Path,
    extensions: &[&str],
    files: &mut Vec<String>,
) -> Result<(), String> {
    for entry in
        std::fs::read_dir(dir_path).map_err(|e| format!("Failed to read directory: {}", e))?
    {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();

        if path.is_dir() {
            collect_audio_files(&path, extensions, files)?;
        } else if path.is_file() {
            if let Some(ext) = path.extension() {
                let ext_str = format!(".{}", ext.to_string_lossy().to_lowercase());
                if extensions.iter().any(|&e| e == ext_str) {
                    if let Some(path_str) = path.to_str() {
                        files.push(path_str.to_string());
                    }
                }
            }
        }
    }
    Ok(())
}

async fn path_to_db(path_str: &str, db: &Db) -> Result<(), String> {
    let path = Path::new(&path_str);

    assert!(path.is_file(), "ERROR: Path is not a file!");
    let tagged_file = Probe::open(path)
        .map_err(|e| format!("ERROR: Bad path provided! {e}"))?
        .read()
        .map_err(|e| format!("ERROR: Failed to read file! {e}"))?;

    let tag = match tagged_file.primary_tag() {
        Some(primary_tag) => primary_tag,
        None => tagged_file
            .first_tag()
            .ok_or_else(|| "ERROR: No tags found in the file".to_string())?,
    };
    let opt_title = tag.title();
    let title = opt_title.as_deref().unwrap_or("Unknown Track");

    let opt_artist = tag.artist();
    let artist = opt_artist.as_deref().unwrap_or("Unknown Artist");
    let opt_album = tag.album();
    let album = opt_album.as_deref().unwrap_or("Unknown Album");
    let opt_genre = tag.genre();
    let genre = opt_genre.as_deref().unwrap_or("Unknown Genre");

    let properties = tagged_file.properties();

    let duration = properties.duration();
    let seconds = duration.as_secs();
    sqlx::query(
        "INSERT OR IGNORE INTO tracks (artist, title, album, genre, length, path) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
    )
    .bind(artist)
    .bind(title)
    .bind(album)
    .bind(genre)
    .bind(seconds as u16)
    .bind(path_str)
    .execute(db)
    .await
    .map_err(|e| format!("Error saving track: {}", e))?;
    Ok(())
}

#[tauri::command]
async fn read_file(state: tauri::State<'_, AppState>, path_str: &str) -> Result<(), String> {
    path_to_db(path_str, &state.db).await
}

#[tauri::command]
async fn read_folder(state: tauri::State<'_, AppState>, path_str: &str) -> Result<(), String> {
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
            eprintln!("Failed to add file '{}': {}", file_path, e);
        }
    }

    Ok(())
}

#[tauri::command]
async fn get_tracks(state: tauri::State<'_, AppState>) -> Result<Vec<Track>, String> {
    let db = &state.db;

    let tracks: Vec<Track> = sqlx::query_as::<_, Track>("SELECT * FROM tracks")
        .fetch(db)
        .try_collect()
        .await
        .map_err(|e| format!("Failed to get tracks {}", e))?;

    Ok(tracks)
}

#[tauri::command]
async fn delete_track(state: tauri::State<'_, AppState>, id: u16) -> Result<(), String> {
    let db = &state.db;

    sqlx::query("DELETE FROM tracks WHERE id = ?1")
        .bind(id)
        .execute(db)
        .await
        .map_err(|e| format!("could not delete track {}", e))?;

    Ok(())
}
