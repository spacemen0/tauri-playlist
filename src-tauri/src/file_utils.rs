use crate::db::Db;
use crate::models::track;
use lofty::prelude::*;
use lofty::probe::Probe;
use sea_orm::{ActiveModelTrait, Set};
use std::path::Path;

pub fn collect_audio_files(
    dir_path: &Path,
    extensions: &[&str],
    files: &mut Vec<String>,
) -> Result<(), String> {
    for entry in
        std::fs::read_dir(dir_path).map_err(|e| format!("Failed to read directory: {e}"))?
    {
        let entry = entry.map_err(|e| format!("Failed to read entry: {e}"))?;
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

pub async fn path_to_db(path_str: &str, db: &Db) -> Result<(), String> {
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

    let track = track::ActiveModel {
        artist: Set(Some(artist.to_string())),
        title: Set(Some(title.to_string())),
        album: Set(Some(album.to_string())),
        genre: Set(Some(genre.to_string())),
        length: Set(Some(seconds as i32)),
        path: Set(path_str.to_string()),
        ..Default::default()
    };

    track
        .insert(db)
        .await
        .map_err(|e| format!("Error saving track: {e}"))?;

    Ok(())
}
