import { useState, useEffect, useRef } from "react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { listen } from "@tauri-apps/api/event";
import { TrackData } from "../types";
import AudioPlayer from "./AudioPlayer";
import Pagination from "./Pagination";
import { path } from "@tauri-apps/api";
import Controls from "./Controls";
import TrackList from "./TrackList";
import MessageDialog from "./MessageDialog";

function Playlist() {
  // State
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [currentTrack, setCurrentTrack] = useState<TrackData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
  const [jumpPage, setJumpPage] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressFile, setProgressFile] = useState("");
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const tracksPerPage = 10;

  useEffect(() => {
    fetchTracks();
  }, []);

  useEffect(() => {
    const removeProgressListener = listen("progress", (event) => {
      const { progress, file_name } = event.payload as {
        progress: number;
        file_name: string;
      };
      setProgress(progress);
      setProgressFile(file_name);
    });

    return () => {
      removeProgressListener.then((fn) => fn());
    };
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
      if (!isSliding) {
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
  }, [isSliding, autoPlay, currentTrack, tracks]);

  const fetchTracks = async () => {
    try {
      const fetchedTracks = await invoke<TrackData[]>("get_tracks");
      setTracks(fetchedTracks);
    } catch (error) {
      console.error("Error fetching tracks:", error);
      setDialog({
        title: "Error",
        message: "Failed to fetch tracks.",
      });
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
      setDialog({
        title: "Error",
        message: "Failed to delete track.",
      });
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
      setDialog({
        title: "Error",
        message: "Failed to add tracks.",
      });
    }
  };

  const handleAddFolder = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected !== null) {
        const summary = await invoke("read_folder", { pathStr: selected });
        fetchTracks();
        setProgress(0);
        setProgressFile("");
        setDialog({ title: "Import Summary", message: summary as string });
      }
    } catch (error) {
      setDialog({
        title: "Following errors occurred",
        message: error as string,
      });
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
    setIsSliding(false);
  };

  const handleSliderMouseDown = () => {
    setIsSliding(true);
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
    <div className="playlist-container relative">
      <Controls
        handleAddTracks={handleAddTracks}
        handleAddFolder={handleAddFolder}
        handlePlayRandomTrack={handlePlayRandomTrack}
        handleOpenDataDir={handleOpenDataDir}
        autoPlay={autoPlay}
        setAutoPlay={setAutoPlay}
      />
      {progress > 0 && progress < 100 && (
        <div className="mt-4 text-center">
          <p>Adding files: {progress.toFixed(2)}%</p>
          <p>({progressFile})</p>
          <div className="w-full h-4 my-4 bg-gray-200 rounded-lg overflow-hidden">
            <div
              className="h-full bg-amber-700 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
      {dialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <MessageDialog
            title={dialog.title}
            message={dialog.message}
            onClose={() => setDialog(null)}
          />
        </div>
      )}
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
