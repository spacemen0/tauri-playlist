use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "playlist_tracks")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub playlist_id: i32,
    #[sea_orm(primary_key)]
    pub track_id: i32,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::playlist::Entity",
        from = "Column::PlaylistId",
        to = "super::playlist::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Playlist,

    #[sea_orm(
        belongs_to = "super::track::Entity",
        from = "Column::TrackId",
        to = "super::track::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Track,
}

impl ActiveModelBehavior for ActiveModel {}
