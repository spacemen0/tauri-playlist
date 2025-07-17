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
    <tr>
      <td data-label="Title">{track.title}</td>
      <td data-label="Artist">{track.artist}</td>
      <td data-label="Album">{track.album}</td>
      <td data-label="Genre">{track.genre}</td>
      <td data-label="Length">{track.length}s</td>
      <td data-label="Actions">
        <button className="play-button" onClick={() => onPlay(track)}>
          Play
        </button>
        <button className="delete-button" onClick={() => onDelete(track.id)}>
          Delete
        </button>
      </td>
    </tr>
  );
};

// Manages the list of tracks and the currently playing track
function Playlist() {
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [currentTrack, setCurrentTrack] = useState<TrackData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const tracksPerPage = 10;

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

  // Pagination logic
  const indexOfLastTrack = currentPage * tracksPerPage;
  const indexOfFirstTrack = indexOfLastTrack - tracksPerPage;
  const currentTracks = tracks.slice(indexOfFirstTrack, indexOfLastTrack);
  const totalPages = Math.ceil(tracks.length / tracksPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="playlist-container">
      <div className="controls">
        <button className="add-button" onClick={handleAddTrack}>
          Add Track{" "}
        </button>
      </div>

      <div className="table-container">
        <table className="track-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Artist</th>
              <th>Album</th>
              <th>Genre</th>
              <th>Length</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentTracks.map((track) => (
              <Track
                key={track.id}
                track={track}
                onPlay={handlePlayTrack}
                onDelete={handleDeleteTrack}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
          <button
            key={number}
            onClick={() => paginate(number)}
            className={`page-item ${currentPage === number ? "active" : ""}`}
          >
            {number}
          </button>
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
