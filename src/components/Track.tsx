import { TrackData } from "../types";
import { formatTime } from "../utils";

// Define the props for the Track component
interface TrackProps {
  track: TrackData;
  currentTrackId: number;
  onPlay: (track: TrackData) => void;
  onDelete: (id: number) => void;
}

// Represents a single track in the playlist
function Track({ track, currentTrackId, onPlay, onDelete }: TrackProps) {
  return (
    <tr
      className={`hover:bg-zinc-700 md:table-row block mb-4 border border-zinc-700 rounded-md text-lg md:border-none ${
        currentTrackId === track.id ? "bg-zinc-700" : ""
      }`}
    >
      <td
        data-label="Title"
        className="py-3 px-6 text-left border-b border-zinc-700 whitespace-nowrap block md:table-cell  md:text-left pl-1/2 relative before:content-[attr(data-label)] before:absolute before:left-2.5 before:w-[calc(50%_-_20px)] before:pr-2.5 before:whitespace-nowrap before:text-left before:font-bold md:before:content-none"
      >
        {track.title}
      </td>
      <td
        data-label="Artist"
        className="py-3 px-6 text-left border-b border-zinc-700 whitespace-nowrap block md:table-cell  md:text-left pl-1/2 relative before:content-[attr(data-label)] before:absolute before:left-2.5 before:w-[calc(50%_-_20px)] before:pr-2.5 before:whitespace-nowrap before:text-left before:font-bold md:before:content-none"
      >
        {track.artist}
      </td>
      <td
        data-label="Album"
        className="py-3 px-6 text-left border-b border-zinc-700 whitespace-nowrap block md:table-cell  md:text-left pl-1/2 relative before:content-[attr(data-label)] before:absolute before:left-2.5 before:w-[calc(50%_-_20px)] before:pr-2.5 before:whitespace-nowrap before:text-left before:font-bold md:before:content-none"
      >
        {track.album}
      </td>
      <td
        data-label="Genre"
        className="py-3 px-6 text-left border-b border-zinc-700 whitespace-nowrap block md:table-cell  md:text-left pl-1/2 relative before:content-[attr(data-label)] before:absolute before:left-2.5 before:w-[calc(50%_-_20px)] before:pr-2.5 before:whitespace-nowrap before:text-left before:font-bold md:before:content-none"
      >
        {track.genre}
      </td>
      <td
        data-label="Length"
        className="py-3 px-6 text-left border-b border-zinc-700 whitespace-nowrap block md:table-cell  md:text-left pl-1/2 relative before:content-[attr(data-label)] before:absolute before:left-2.5 before:w-[calc(50%_-_20px)] before:pr-2.5 before:whitespace-nowrap before:text-left before:font-bold md:before:content-none"
      >
        {formatTime(track.length)}
      </td>
      <td
        data-label="Actions"
        className="py-3 px-6  border-b border-zinc-700 whitespace-nowrap block md:table-cell text-center md:text-left"
      >
        <button
          className="py-2 px-3 text-white border-none rounded-md cursor-pointer text-lg bg-orange-500 mr-1.5 hover:bg-orange-700 md:py-1.5 md:px-2.5 "
          onClick={() => onPlay(track)}
        >
          Play
        </button>
        <button
          className="py-2 px-3 text-white border-none rounded-md cursor-pointer text-lg bg-orange-500 hover:bg-orange-700 md:py-1.5 md:px-2.5 "
          onClick={() => onDelete(track.id)}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

export default Track;
