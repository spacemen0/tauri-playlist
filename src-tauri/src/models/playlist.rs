use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "playlists")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    #[sea_orm(unique)]
    pub name: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::playlist_track::Entity")]
    PlaylistTrack,
}

impl sea_orm::Related<super::playlist::Entity> for super::playlist_track::Entity {
    fn to() -> sea_orm::RelationDef {
        super::playlist_track::Relation::Playlist.def()
    }
}

impl Related<super::track::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::PlaylistTrack.def()
    }
    fn via() -> Option<RelationDef> {
        Some(super::playlist_track::Relation::Track.def().rev())
    }
}

impl ActiveModelBehavior for ActiveModel {}
