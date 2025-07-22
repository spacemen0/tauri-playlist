use sea_orm::{ConnectionTrait, Database, DatabaseConnection, EntityTrait};
use tauri::{App, Manager};

use crate::models::{playlist, playlist_track, track};

pub type Db = DatabaseConnection;

pub struct AppState {
    pub db: Db,
}

pub async fn setup_db(app: &App) -> Db {
    let mut path = app.path().app_data_dir().expect("failed to get data_dir");
    std::fs::create_dir_all(&path).expect("Failed to create app data directory");
    path.push("db.sqlite");
    if !path.exists() {
        std::fs::File::create(&path).expect("Failed to create database file");
    }

    let db_url = format!("sqlite://{}", path.to_str().unwrap());
    let db = Database::connect(&db_url)
        .await
        .expect("Failed to connect to database");
    create_tables(&db).await;

    db
}

async fn create_tables(db: &Db) {
    create_table(db, track::Entity).await;
    create_table(db, playlist::Entity).await;
    create_table(db, playlist_track::Entity).await;
}

async fn create_table<E>(db: &Db, entity: E)
where
    E: EntityTrait,
{
    let builder = db.get_database_backend();
    let schema = sea_orm::Schema::new(builder);
    let mut stmt = schema.create_table_from_entity(entity);

    db.execute(builder.build(stmt.if_not_exists()))
        .await
        .unwrap();
}
