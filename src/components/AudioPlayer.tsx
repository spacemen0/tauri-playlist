import { TrackData } from "../types";
import { formatTime } from "../utils";

interface AudioPlayerProps {
  track: TrackData;
  isPlaying: boolean;
  currentTime: number;
  currentVolume: number;
  duration: number;
  onPlayPause: () => void;
  onSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAudioSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSliderMouseDown: () => void;
  onAudioSliderMouseDown: () => void;
  onSliderMouseUp: () => void;
  onAudioSliderMouseUp: () => void;
}

function AudioPlayer({
  track,
  isPlaying,
  currentTime,
  currentVolume,
  duration,
  onPlayPause,
  onSliderChange,
  onAudioSliderChange,
  onSliderMouseDown,
  onAudioSliderMouseDown,
  onSliderMouseUp,
  onAudioSliderMouseUp,
}: AudioPlayerProps) {
  return (
    <div className="mt-2 p-2.5 bg-zinc-700 rounded-md text-center text-lg">
      <div className="text-xl mt-2 text-white">
        Now Playing: {track.artist} - {track.title}
      </div>
      <div className="flex items-center justify-center gap-2.5 mb-2">
        <button className="btn" onClick={onPlayPause}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <input
          type="range"
          min={0}
          max={duration}
          step={0.01}
          value={currentTime}
          onChange={onSliderChange}
          onMouseDown={onSliderMouseDown}
          onMouseUp={onSliderMouseUp}
          className="w-[72%] inline-block"
        />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={currentVolume}
          onChange={onAudioSliderChange}
          onMouseDown={onAudioSliderMouseDown}
          onMouseUp={onAudioSliderMouseUp}
          className="w-32 inline-block"
        />
        <div>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}

export default AudioPlayer;
