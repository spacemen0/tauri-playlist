use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "tracks")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub artist: Option<String>,
    pub title: Option<String>,
    pub album: Option<String>,
    pub genre: Option<String>,
    pub length: Option<i32>,
    #[sea_orm(unique)]
    pub path: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::playlist_track::Entity")]
    PlaylistTrack,
}

impl Related<super::track::Entity> for super::playlist_track::Entity {
    fn to() -> RelationDef {
        super::playlist_track::Relation::Track.def()
    }
}

impl Related<super::playlist::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::PlaylistTrack.def()
    }
    fn via() -> Option<RelationDef> {
        Some(super::playlist_track::Relation::Playlist.def().rev())
    }
}

impl ActiveModelBehavior for ActiveModel {}
