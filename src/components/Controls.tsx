import Switch from "./Switch";

interface ControlsProps {
  handleAddTracks: () => void;
  handleAddFolder: () => void;
  handlePlayRandomTrack: () => void;
  handleOpenDataDir: () => void;
  autoPlay: boolean;
  setAutoPlay: (checked: boolean) => void;
}

function Controls({
  handleAddTracks,
  handleAddFolder,
  handlePlayRandomTrack,
  handleOpenDataDir,
  autoPlay,
  setAutoPlay,
}: ControlsProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-5 flex-wrap">
      <button className="btn" onClick={handleAddTracks}>
        Add Tracks
      </button>
      <button className="btn" onClick={handleAddFolder}>
        Add Folder
      </button>
      <button className="btn" onClick={handlePlayRandomTrack}>
        Play Random Track
      </button>
      <button className="btn" onClick={handleOpenDataDir}>
        Open Data Dir
      </button>
      <div className="flex items-center gap-2">
        <span>Auto Play Next</span>
        <Switch
          checked={autoPlay}
          onChange={(checked) => setAutoPlay(checked)}
        />
      </div>
    </div>
  );
}

export default Controls;
