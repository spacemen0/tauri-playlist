use sqlx::{
    migrate::{MigrateDatabase, MigrateError},
    sqlite::SqlitePoolOptions,
    Pool, Sqlite,
};
use tauri::{App, Manager};

pub type Db = Pool<Sqlite>;

pub struct AppState {
    pub db: Db,
}

pub async fn setup_db(app: &App) -> Db {
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
            eprintln!("Migration version mismatch detected: {version:?}.");
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
