use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Track {
    pub id: u16,
    pub length: u16,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub genre: String,
    pub path: String,
}
