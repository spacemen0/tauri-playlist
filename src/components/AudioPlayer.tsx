import { TrackData } from "../types";
import { formatTime } from "../utils";

interface AudioPlayerProps {
  track: TrackData;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSliderMouseDown: () => void;
  onSliderMouseUp: () => void;
}

function AudioPlayer({
  track,
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onSliderChange,
  onSliderMouseDown,
  onSliderMouseUp,
}: AudioPlayerProps) {
  return (
    <div className="mt-2 p-2.5 bg-zinc-700 rounded-md text-center text-lg">
      <div className="now-playing">
        Now Playing: {track.artist} - {track.title}
      </div>
      <div className="flex items-center justify-center gap-2.5">
        <button
          className="p-2 m-1.5 bg-orange-500 hover:bg-orange-700 text-white border-none rounded-md cursor-pointer text-lg"
          onClick={onPlayPause}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <input
          style={{
            width: "80%",
            display: "inline-block",
          }}
          type="range"
          min={0}
          max={duration}
          step={0.01}
          value={currentTime}
          onChange={onSliderChange}
          onMouseDown={onSliderMouseDown}
          onMouseUp={onSliderMouseUp}
          className="w-64"
        />
        <div>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}

export default AudioPlayer;
