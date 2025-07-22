import { useState } from "react";
import { TrackData } from "../types";
import { invoke } from "@tauri-apps/api/core";

export function SearchPanel({
  setTracks,
  handleBack,
  setDialog,
}: {
  setTracks: React.Dispatch<React.SetStateAction<TrackData[]>>;
  handleBack: () => void;
  setDialog: React.Dispatch<
    React.SetStateAction<{ title: string; message: string } | null>
  >;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = async () => {
    if (searchQuery.trim() === "") {
      setTracks([]);
      return;
    }
    try {
      const results = await invoke<TrackData[]>("search_tracks", {
        query: searchQuery,
      });
      setTracks(results);
    } catch (error) {
      console.error("Error searching tracks:", error);
      setDialog({ title: "error", message: "Failed to search tracks" });
    }
  };
  return (
    <div className="flex items-center justify-center gap-4 mb-4">
      <input
        type="text"
        placeholder="Search tracks..."
        className="p-2 border-2 rounded w-3xl h-12 font-medium text-white border-[#e78534] bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-[#975508] focus:border-none"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <button className="add-button" onClick={handleSearch}>
        Search
      </button>
      <button className="add-button" onClick={handleBack}>
        Back
      </button>
    </div>
  );
}
