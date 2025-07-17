CREATE TABLE IF NOT EXISTS tracks (
	id INTEGER PRIMARY KEY,
	artist TEXT,
	title TEXT,
	album TEXT,
	genre TEXT,
	length INTEGER,
	path TEXT NOT NULL
);
