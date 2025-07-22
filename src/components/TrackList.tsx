import { TrackData } from "../types";
import Track from "./Track";

interface TrackListProps {
  tracks: TrackData[];
  onPlay: (track: TrackData) => void;
  onDelete: (id: number) => void;
}

function TrackList({ tracks, onPlay, onDelete }: TrackListProps) {
  return (
    <div className="w-full flex justify-center">
      <table className="self-center border-collapse mb-5 block overflow-x-auto">
        <thead className="hidden md:table-header-group">
          <tr>
            <th className="p-3 text-left border-b border-zinc-700 bg-zinc-600 font-bold whitespace-nowrap">
              Title
            </th>
            <th className="p-3 text-left border-b border-zinc-700 bg-zinc-600 font-bold whitespace-nowrap">
              Artist
            </th>
            <th className="p-3 text-left border-b border-zinc-700 bg-zinc-600 font-bold whitespace-nowrap">
              Album
            </th>
            <th className="p-3 text-left border-b border-zinc-700 bg-zinc-600 font-bold whitespace-nowrap">
              Genre
            </th>
            <th className="p-3 text-left border-b border-zinc-700 bg-zinc-600 font-bold whitespace-nowrap">
              Length
            </th>
            <th className="p-3 text-left border-b border-zinc-700 bg-zinc-600 font-bold whitespace-nowrap">
              Actions
            </th>
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
