import React, { useState, useEffect } from "react";

import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

// Define the type for a single track
interface TrackData {
  id: number;
  title: string;
  artist: string;
  album: string;
  genre: string;
  length: number;
  path: string;
}

// Define the props for the Track component
interface TrackProps {
  track: TrackData;
  onPlay: (track: TrackData) => void;
  onDelete: (id: number) => void;
}

function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="slider"></span>
    </label>
  );
}

// Represents a single track in the playlist
function Track({ track, onPlay, onDelete }: TrackProps) {
  return (
    <tr>
      <td data-label="Title">{track.title}</td>
      <td data-label="Artist">{track.artist}</td>
      <td data-label="Album">{track.album}</td>
      <td data-label="Genre">{track.genre}</td>
      <td data-label="Length">{formatTime(track.length)}</td>
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
}

// Manages the list of tracks and the currently playing track
function Playlist() {
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [currentTrack, setCurrentTrack] = useState<TrackData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      console.log("Playing track:", currentTrack.path);
      audioRef.current.src = convertFileSrc(currentTrack.path);
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [currentTrack]);
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

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDeleteTrack = async (id: number) => {
    try {
      await invoke("delete_track", { id });
      fetchTracks(); // Refetch tracks after deletion
    } catch (error) {
      console.error("Error deleting track:", error);
    }
  };

  const handleAddTracks = async () => {
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

  // Audio player controls
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  // Update currentTime as the song plays
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!isSeeking) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      if (
        autoPlay &&
        currentTrack &&
        currentTracks.length > 0 &&
        currentTracks.indexOf(currentTrack) < currentTracks.length - 1
      ) {
        const nextTrackIndex = currentTracks.indexOf(currentTrack) + 1;
        setCurrentTrack(currentTracks[nextTrackIndex]);
      } else {
        setIsPlaying(false);
        setCurrentTrack(null);
        setCurrentTime(0);
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [isSeeking, autoPlay]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseFloat(e.target.value));
  };

  const handleSliderMouseUp = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = currentTime;
      audio.play();
      setIsPlaying(true);
    }
    setIsSeeking(false);
  };

  const handleSliderMouseDown = () => {
    setIsSeeking(true);
  };

  const handleAddFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected !== null) {
        await invoke("read_folder", { pathStr: selected });
        fetchTracks();
        console.log("Selected folder:", selected);
      }
    } catch (error) {
      console.error("Error adding folder:", error);
    }
  };

  const [jumpPage, setJumpPage] = useState("");
  const handleJump = () => {
    const pageNum = parseInt(jumpPage, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      paginate(pageNum);
      setJumpPage("");
    }
  };
  const renderPages = () => {
    const pages = [];

    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <button
            key={i}
            onClick={() => paginate(i)}
            className={`page-item ${currentPage === i ? "active" : ""}`}
          >
            {i}
          </button>
        );
      }
    } else {
      pages.push(
        <button
          key={1}
          onClick={() => paginate(1)}
          className={`page-item ${currentPage === 1 ? "active" : ""}`}
        >
          1
        </button>
      );

      if (currentPage > 4) {
        pages.push(
          <span key="start-ellipsis" className="ellipsis">
            ...
          </span>
        );
      }

      const startPage = Math.max(2, currentPage - 2);
      const endPage = Math.min(totalPages - 1, currentPage + 2);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <button
            key={i}
            onClick={() => paginate(i)}
            className={`page-item ${currentPage === i ? "active" : ""}`}
          >
            {i}
          </button>
        );
      }

      if (currentPage < totalPages - 3) {
        pages.push(
          <span key="end-ellipsis" className="ellipsis">
            ...
          </span>
        );
      }

      pages.push(
        <button
          key={totalPages}
          onClick={() => paginate(totalPages)}
          className={`page-item ${currentPage === totalPages ? "active" : ""}`}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  const handlePlayRandomTrack = () => {
    if (tracks.length === 0) return;
    const randomIndex = Math.floor(Math.random() * tracks.length);
    const randomTrack = tracks[randomIndex];
    setCurrentTrack(randomTrack);
    if (audioRef.current) {
      audioRef.current.src = convertFileSrc(randomTrack.path);
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="playlist-container">
      <div className="controls">
        <button className="add-button" onClick={handleAddTracks}>
          Add Tracks{" "}
        </button>
        <button className="add-button" onClick={handleAddFolder}>
          Add Folder{" "}
        </button>
        <button className="add-button" onClick={handlePlayRandomTrack}>
          Play Random Track{" "}
        </button>
        <div className="auto-play-toggle">
          <span>Auto Play Next</span>
          <Switch
            checked={autoPlay}
            onChange={(checked) => setAutoPlay(checked)}
          />
        </div>
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
        {renderPages()}
        <input
          min="1"
          max={totalPages}
          value={jumpPage}
          onChange={(e) => setJumpPage(e.target.value)}
          placeholder="Page"
          className="m-[5px] p-1 border rounded w-16 text-center bg-white text-black focus:outline-none focus:ring-2 focus:ring-[#975508] focus:border-transparent"
        />
        <button
          onClick={handleJump}
          className=" m-[5px] px-2 rounded bg-[#e78534] text-black hover:bg-[#975508]"
        >
          Go
        </button>
      </div>
      {currentTrack && (
        <div className="track-info">
          {" "}
          <div className="now-playing">
            Now Playing: {currentTrack.artist} - {currentTrack.title}
          </div>
          <div className="audio-controls">
            {" "}
            <button className="play-pause-button" onClick={togglePlayPause}>
              {isPlaying ? "Pause" : "Play"}
            </button>
            <input
              style={{
                width: "80%",
                display: "inline-block",
              }}
              type="range"
              min={0}
              max={duration}
              step={0.01}
              value={currentTime}
              onChange={handleSliderChange}
              onMouseDown={handleSliderMouseDown}
              onMouseUp={handleSliderMouseUp}
              className="w-64"
            />
            <div>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>
      )}
      <audio ref={audioRef} />
    </div>
  );
}

function App() {
  return (
    <main className="main-container">
      <Playlist />
    </main>
  );
}

function formatTime(time: number) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default App;
