import React, { useState, useEffect } from "react";
import "./App.css";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

// Define the type for a single track
interface TrackData {
  id: number;
  title: string;
  artist: string;
  album: string;
  genre: string;
  length: number;
}

// Define the props for the Track component
interface TrackProps {
  track: TrackData;
  onPlay: (track: TrackData) => void;
  onDelete: (id: number) => void;
}

// Represents a single track in the playlist
const Track: React.FC<TrackProps> = ({ track, onPlay, onDelete }) => {
  return (
    <div className="track">
      <span className="track-title">{track.title}</span>
      <span className="track-artist">{track.artist}</span>
      <span className="track-album">{track.album}</span>
      <span className="track-genre">{track.genre}</span>
      <span className="track-length">{track.length}s</span>
      <button className="play-button" onClick={() => onPlay(track)}>
        Play
      </button>
      <button className="delete-button" onClick={() => onDelete(track.id)}>
        Delete
      </button>
    </div>
  );
};

// Manages the list of tracks and the currently playing track
function Playlist() {
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [currentTrack, setCurrentTrack] = useState<TrackData | null>(null);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const fetchedTracks = await invoke<TrackData[]>("get_tracks");
      setTracks(fetchedTracks);
    } catch (error) {
      console.error("Error fetching tracks:", error);
    }
  };

  const handlePlayTrack = (track: TrackData) => {
    setCurrentTrack(track);
  };

  const handleDeleteTrack = async (id: number) => {
    try {
      await invoke("delete_track", { id });
      fetchTracks(); // Refetch tracks after deletion
    } catch (error) {
      console.error("Error deleting track:", error);
    }
  };

  const handleAddTrack = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "Audio",
            extensions: ["mp3", "wav", "ogg", "flac", "m4a"],
          },
        ],
      });

      if (selected !== null) {
        // Handle both array of paths or single path
        const paths = Array.isArray(selected) ? selected : [selected];

        for (const path of paths) {
          await invoke("read_file", { pathStr: path });
        }

        fetchTracks(); // Refetch tracks after adding all files
      }
    } catch (error) {
      console.error("Error adding track:", error);
    }
  };

  return (
    <div className="playlist-container">
      <button className="add-button" onClick={handleAddTrack}>
        Add Track
      </button>
      <div className="track-list">
        {tracks.map((track) => (
          <Track
            key={track.id}
            track={track}
            onPlay={handlePlayTrack}
            onDelete={handleDeleteTrack}
          />
        ))}
      </div>
      {currentTrack && (
        <div className="now-playing">Now Playing: {currentTrack.title}</div>
      )}
    </div>
  );
}

function App() {
  return (
    <main className="container">
      <Playlist />
    </main>
  );
}

export default App;
