
import { TrackData } from "../types";
import Track from "./Track";

interface TrackListProps {
  tracks: TrackData[];
  onPlay: (track: TrackData) => void;
  onDelete: (id: number) => void;
}

function TrackList({ tracks, onPlay, onDelete }: TrackListProps) {
  return (
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
          {tracks.map((track) => (
            <Track
              key={track.id}
              track={track}
              onPlay={onPlay}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TrackList;
