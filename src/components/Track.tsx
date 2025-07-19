import { TrackData } from "../types";
import { formatTime } from "../utils";

// Define the props for the Track component
interface TrackProps {
  track: TrackData;
  onPlay: (track: TrackData) => void;
  onDelete: (id: number) => void;
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

export default Track;
