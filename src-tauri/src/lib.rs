use std::path::Path;

use futures::TryStreamExt;
use lofty::prelude::*;
use lofty::probe::Probe;
use serde::{Deserialize, Serialize};
use sqlx::{migrate::MigrateDatabase, prelude::FromRow, sqlite::SqlitePoolOptions, Pool, Sqlite};
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
            delete_track
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
    match std::fs::create_dir_all(path.clone()) {
        Ok(_) => {}
        Err(err) => {
            panic!("error creating directory {}", err);
        }
    };

    path.push("db.sqlite");

    Sqlite::create_database(
        format!(
            "sqlite:{}",
            path.to_str().expect("path should be something")
        )
        .as_str(),
    )
    .await
    .expect("failed to create database");

    let db = SqlitePoolOptions::new()
        .connect(path.to_str().unwrap())
        .await
        .unwrap();

    sqlx::migrate!("./migrations").run(&db).await.unwrap();

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
}

#[tauri::command]
async fn read_file(state: tauri::State<'_, AppState>, path_str: &str) -> Result<(), String> {
    let path = Path::new(&path_str);

    assert!(path.is_file(), "ERROR: Path is not a file!");

    let tagged_file = Probe::open(path)
        .expect("ERROR: Bad path provided!")
        .read()
        .expect("ERROR: Failed to read file!");

    let tag = match tagged_file.primary_tag() {
        Some(primary_tag) => primary_tag,
        None => tagged_file.first_tag().expect("ERROR: No tags found!"),
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
    let seconds = duration.as_secs() % 60;
    let db = &state.db;
    sqlx::query(
        "INSERT INTO tracks (artist, title, album, genre, length, path) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
    )
    .bind(artist)
    .bind(title)
    .bind(album)
    .bind(genre)
    .bind(seconds as u16)
    .bind(path_str)
    .execute(db)
    .await
    .map_err(|e| format!("Error saving todo: {}", e))?;
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
