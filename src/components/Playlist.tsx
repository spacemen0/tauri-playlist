import { useState, useEffect, useRef } from "react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { TrackData } from "../types";
import AudioPlayer from "./AudioPlayer";
import Pagination from "./Pagination";
import { path } from "@tauri-apps/api";
import Controls from "./Controls";
import TrackList from "./TrackList";

function Playlist() {
  // State
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [currentTrack, setCurrentTrack] = useState<TrackData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [jumpPage, setJumpPage] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const tracksPerPage = 10;

  // Effects
  useEffect(() => {
    fetchTracks();
  }, []);

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      console.log("Playing track:", currentTrack.path);
      audioRef.current.src = convertFileSrc(currentTrack.path);
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [currentTrack]);

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
        tracks.length > 0 &&
        tracks.indexOf(currentTrack) < tracks.length - 1
      ) {
        const nextTrackIndex = tracks.indexOf(currentTrack) + 1;
        setCurrentTrack(tracks[nextTrackIndex]);
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
  }, [isSeeking, autoPlay, currentTrack, tracks]);

  // Data Fetching
  const fetchTracks = async () => {
    try {
      const fetchedTracks = await invoke<TrackData[]>("get_tracks");
      setTracks(fetchedTracks);
    } catch (error) {
      console.error("Error fetching tracks:", error);
    }
  };

  // Handlers
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

  const handleJump = () => {
    const pageNum = parseInt(jumpPage, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      paginate(pageNum);
      setJumpPage("");
    }
  };

  // Pagination
  const indexOfLastTrack = currentPage * tracksPerPage;
  const indexOfFirstTrack = indexOfLastTrack - tracksPerPage;
  const currentTracks = tracks.slice(indexOfFirstTrack, indexOfLastTrack);
  const totalPages = Math.ceil(tracks.length / tracksPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="playlist-container">
      <Controls
        handleAddTracks={handleAddTracks}
        handleAddFolder={handleAddFolder}
        handlePlayRandomTrack={handlePlayRandomTrack}
        handleOpenDataDir={handleOpenDataDir}
        autoPlay={autoPlay}
        setAutoPlay={setAutoPlay}
      />
      <TrackList
        tracks={currentTracks}
        onPlay={handlePlayTrack}
        onDelete={handleDeleteTrack}
      />
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
