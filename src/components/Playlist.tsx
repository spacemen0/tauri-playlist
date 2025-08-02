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
import { SearchPanel } from "./SearchPanel";

function Playlist() {
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [searchResults, setSearchResults] = useState<TrackData[]>([]);
  const [numTracks, setNumTracks] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<TrackData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [searchPagination, setSearchPagination] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentVolume, setCurrentVolume] = useState(0.5);
  const [duration, setDuration] = useState(0);
  const [isTimeSliding, setIsTimeSliding] = useState(false);
  const [jumpPage, setJumpPage] = useState<number | "">(1);
  const [progress, setProgress] = useState(0);
  const [progressFile, setProgressFile] = useState("");
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const tracksPerPage = 10;

  useEffect(() => {
    fetchNumTracks();
    fetchTracks(1);
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
      if (!isTimeSliding) {
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
  }, [isTimeSliding, autoPlay, currentTrack, tracks]);

  const fetchNumTracks = async () => {
    try {
      const totalTracks = await invoke<number>("get_tracks_count");
      setNumTracks(totalTracks);
    } catch (error) {
      console.error("Error fetching number of tracks:", error);
      setDialog({
        title: "Error",
        message: "Failed to fetch number of tracks.",
      });
    }
  };

  const fetchTracks = async (page: number): Promise<TrackData[]> => {
    try {
      const fetchedTracks = await invoke<TrackData[]>("get_tracks_paginated", {
        page,
        pageSize: tracksPerPage,
      });
      setTracks(fetchedTracks);
      return fetchedTracks;
    } catch (error) {
      console.error("Error fetching tracks:", error);
      setDialog({
        title: "Error",
        message: "Failed to fetch tracks.",
      });
      return [];
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

        fetchTracks(currentPage);
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
        fetchTracks(currentPage);
        setProgress(0);
        setProgressFile("");
        setDialog({ title: "Import Summary", message: summary as string });
      }
    } catch (error) {
      fetchTracks(currentPage);
      setProgress(0);
      setProgressFile("");
      setDialog({
        title: "Following errors occurred",
        message: error as string,
      });
    }
  };

  const handlePlayRandomTrack = async () => {
    if (numTracks === 0) return;

    const randomPage = Math.ceil(Math.random() * totalPages);
    if (searchPagination) {
      setCurrentPage(randomPage);
      const paginatedTracks = searchResults.slice(
        (randomPage - 1) * tracksPerPage,
        randomPage * tracksPerPage
      );
      setTracks(paginatedTracks);
      const randomIndex = Math.floor(Math.random() * paginatedTracks.length);
      const randomTrack = paginatedTracks[randomIndex];
      setCurrentTrack(randomTrack);
    } else {
      setCurrentPage(randomPage);
      const fetchedTracks = await fetchTracks(randomPage);
      const randomIndex = Math.floor(Math.random() * fetchedTracks.length);
      const randomTrack = fetchedTracks[randomIndex];
      setCurrentTrack(randomTrack);
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
  const handleAudioSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    setCurrentVolume(volume);
  };
  const handleSliderMouseUp = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = currentTime;
      audio.play();
      setIsPlaying(true);
    }
    setIsTimeSliding(false);
  };

  const handleAudioSliderMouseUp = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = currentVolume;
    }
    setIsTimeSliding(false);
  };

  const handleSliderMouseDown = () => {
    setIsTimeSliding(true);
  };

  const handleJump = () => {
    if (typeof jumpPage === "string") {
      setJumpPage("");
      return;
    }
    const pageNum = jumpPage;
    if (pageNum >= 1 && pageNum <= totalPages) {
      paginate(pageNum);
      setJumpPage("");
    }
  };

  const handleSearch = async (query: string) => {
    if (query.trim() === "") {
      setTracks([]);
      return;
    }
    try {
      const results = await invoke<TrackData[]>("search_tracks", {
        query,
      });
      setSearchResults(results);
      setSearchPagination(true);
      setCurrentPage(1);
      setNumTracks(results.length);
      setTracks(results.slice(0, tracksPerPage));
    } catch (error) {
      console.error("Error searching tracks:", error);
      setDialog({ title: "error", message: "Failed to search tracks" });
    }
  };

  const totalPages = Math.ceil(numTracks / tracksPerPage);

  const paginate = (pageNumber: number) => {
    if (searchPagination) {
      setCurrentPage(pageNumber);
      setTracks(
        searchResults.slice(
          (pageNumber - 1) * tracksPerPage,
          pageNumber * tracksPerPage
        )
      );
    } else {
      setCurrentPage(pageNumber);
      fetchTracks(pageNumber);
    }
  };

  return (
    <div className="w-full bg-zinc-800 rounded-lg p-5 shadow-lg md:p-4 sm:p-3 h-full flex flex-col justify-center">
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
      <SearchPanel
        handleSearch={handleSearch}
        handleBack={() => {
          setCurrentPage(1);
          fetchNumTracks();
          fetchTracks(1);
          setSearchPagination(false);
        }}
      />
      <TrackList
        tracks={tracks}
        currentTrackId={currentTrack ? currentTrack.id : -1}
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
          currentVolume={currentVolume}
          duration={duration}
          onPlayPause={togglePlayPause}
          onSliderChange={handleSliderChange}
          onSliderMouseDown={handleSliderMouseDown}
          onSliderMouseUp={handleSliderMouseUp}
          onAudioSliderMouseUp={handleAudioSliderMouseUp}
          onAudioSliderChange={handleAudioSliderChange}
        />
      )}
      <audio ref={audioRef} />
    </div>
  );
}

export default Playlist;
