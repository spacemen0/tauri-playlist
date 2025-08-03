import { useState } from "react";
import { TrackData } from "../types";
import { formatTime } from "../utils";

interface AudioPlayerProps {
  track: TrackData;
  isPlaying: boolean;
  currentTime: number;
  currentVolume: number;
  duration: number;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAudioSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSliderMouseDown: () => void;
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
  onPrev,
  onNext,
  onSliderChange,
  onAudioSliderChange,
  onSliderMouseDown,
  onSliderMouseUp,
  onAudioSliderMouseUp,
}: AudioPlayerProps) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  return (
    <div className="mt-2 p-2.5 pb-4 bg-zinc-700 rounded-md text-center text-lg">
      <div className="text-xl mt-2 text-white">
        Now Playing: {track.artist} - {track.title}
      </div>
      <div className="flex items-center justify-center gap-2.5 mb-2">
        <button className="btn" onClick={onPrev}>
          Prev
        </button>
        <button className="btn" onClick={onPlayPause}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button className="btn mr-2" onClick={onNext}>
          Next
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
        <div className="flex items-center gap-2 flex-col">
          {" "}
          {showVolumeSlider && (
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={currentVolume}
              onChange={onAudioSliderChange}
              onMouseUp={() => {
                onAudioSliderMouseUp();
                setShowVolumeSlider(false);
              }}
              className="w-4 h-24 absolute bottom-20 mb-2 z-10 "
              style={{
                writingMode: "vertical-rl",
                direction: "rtl",
              }}
            />
          )}
          <button
            className="w-8"
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
          >
            {showVolumeSlider ? "🔊" : "🔉"}
          </button>
        </div>

        <div>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}

export default AudioPlayer;
