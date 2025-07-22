import { useState } from "react";

export function SearchPanel({
  handleSearch,
  handleBack,
}: {
  handleSearch: (query: string) => Promise<void>;
  handleBack: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex items-center justify-center gap-4 mb-4">
      <input
        type="text"
        placeholder="Search tracks..."
        className="p-2 border-2 rounded w-3xl h-12 font-medium text-white border-[#e78534] bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-[#975508] focus:border-none"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSearch(searchQuery);
          }
        }}
      />
      <button
        className="add-button"
        onClick={handleSearch.bind(null, searchQuery)}
      >
        Search
      </button>
      <button
        className="add-button"
        onClick={() => {
          setSearchQuery("");
          handleBack();
        }}
      >
        Back
      </button>
    </div>
  );
}
