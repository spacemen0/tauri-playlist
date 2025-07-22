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
      <td data-label="Title" className="rounded-l-md table_cell">
        {track.title}
      </td>
      <td data-label="Artist" className="table_cell">
        {track.artist}
      </td>
      <td data-label="Album" className="table_cell">
        {track.album}
      </td>
      <td data-label="Genre" className="table_cell">
        {track.genre}
      </td>
      <td data-label="Length" className="table_cell">
        {formatTime(track.length)}
      </td>
      <td data-label="Actions" className="rounded-r-md table_cell">
        <button className="btn mr-1.5" onClick={() => onPlay(track)}>
          Play
        </button>
        <button className="btn" onClick={() => onDelete(track.id)}>
          Delete
        </button>
      </td>
    </tr>
  );
}

export default Track;
