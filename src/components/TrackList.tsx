import { TrackData } from "../types";
import Track from "./Track";

interface TrackListProps {
  tracks: TrackData[];
  currentTrackId: number;
  onPlay: (track: TrackData) => void;
  onDelete: (id: number) => void;
}

function TrackList({
  tracks,
  currentTrackId,
  onPlay,
  onDelete,
}: TrackListProps) {
  return (
    <div className="w-full flex justify-center">
      <table className="self-center border-collapse mb-5 block overflow-x-auto">
        <thead className="hidden md:table-header-group text-lg">
          <tr>
            <th className="rounded-l-md table_header">Title</th>
            <th className="table_header">Artist</th>
            <th className="table_header">Album</th>
            <th className="table_header">Genre</th>
            <th className="table_header">Length</th>
            <th className="rounded-r-md table_header">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track) => (
            <Track
              key={track.id}
              track={track}
              currentTrackId={currentTrackId}
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
