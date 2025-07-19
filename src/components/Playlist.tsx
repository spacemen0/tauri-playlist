import { useState, useEffect, useRef } from "react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { TrackData } from "../types";
import Track from "./Track";
import Switch from "./Switch";
import AudioPlayer from "./AudioPlayer";
import Pagination from "./Pagination";
import { path } from "@tauri-apps/api";

function Playlist() {
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [currentTrack, setCurrentTrack] = useState<TrackData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

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
      tracks.forEach((track, index) => {
        if (track.id === id) {
          if (currentTrack && currentTrack.id === id) {
            setCurrentTrack(null);
            setIsPlaying(false);
          }
          tracks.splice(index, 1);
        }
      });
      setTracks([...tracks]);
      if (
        audioRef.current &&
        audioRef.current.src === convertFileSrc(currentTrack?.path || "")
      ) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      console.log("Track deleted:", id);
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
        const paths = Array.isArray(selected) ? selected : [selected];

        for (const path of paths) {
          await invoke("read_file", { pathStr: path });
        }

        fetchTracks();
      }
    } catch (error) {
      console.error("Error adding track:", error);
    }
  };

  const indexOfLastTrack = currentPage * tracksPerPage;
  const indexOfFirstTrack = indexOfLastTrack - tracksPerPage;
  const currentTracks = tracks.slice(indexOfFirstTrack, indexOfLastTrack);
  const totalPages = Math.ceil(tracks.length / tracksPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

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
  }, [isSeeking, autoPlay, currentTrack, currentTracks]);

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

  const handleOpenDataDir = async () => {
    try {
      const dataFolder = await path.appConfigDir();
      if (dataFolder) {
        revealItemInDir(dataFolder);
      }
    } catch (error) {
      console.error("Error opening data folder:", error);
    }
  };

  return (
    <div className="playlist-container">
      <div className="controls">
        <button className="add-button" onClick={handleAddTracks}>
          Add Tracks
        </button>
        <button className="add-button" onClick={handleAddFolder}>
          Add Folder
        </button>
        <button className="add-button" onClick={handlePlayRandomTrack}>
          Play Random Track
        </button>
        <button className="add-button" onClick={handleOpenDataDir}>
          Open Data Dir
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        paginate={paginate}
        jumpPage={jumpPage}
        setJumpPage={setJumpPage}
        handleJump={handleJump}
      />
      {currentTrack && (
        <AudioPlayer
          track={currentTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onPlayPause={togglePlayPause}
          onSliderChange={handleSliderChange}
          onSliderMouseDown={handleSliderMouseDown}
          onSliderMouseUp={handleSliderMouseUp}
        />
      )}
      <audio ref={audioRef} />
    </div>
  );
}

export default Playlist;
