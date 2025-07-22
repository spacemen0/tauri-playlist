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
        className="p-2 border-2 rounded w-3xl h-12 font-medium text-white border-orange-500 bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-orange-700 focus:border-none"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSearch(searchQuery);
          }
        }}
      />
      <button className="btn" onClick={handleSearch.bind(null, searchQuery)}>
        Search
      </button>
      <button
        className="btn"
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
