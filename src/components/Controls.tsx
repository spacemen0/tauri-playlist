
import Switch from "./Switch";

interface ControlsProps {
  handleAddTracks: () => void;
  handleAddFolder: () => void;
  handlePlayRandomTrack: () => void;
  handleOpenDataDir: () => void;
  autoPlay: boolean;
  setAutoPlay: (checked: boolean) => void;
}

function Controls({ handleAddTracks, handleAddFolder, handlePlayRandomTrack, handleOpenDataDir, autoPlay, setAutoPlay }: ControlsProps) {
  return (
    <div className="controls">
      <button className="add-button" onClick={handleAddTracks}>
        Add Tracks
      </button>
      <button className="add-button" onClick={handleAddFolder}>
        Add Folder
      </button>
      <button className="add-button" onClick={handlePlayRandomTrack}>
        Play Random Track
      </button>
      <button className="add-button" onClick={handleOpenDataDir}>
        Open Data Dir
      </button>
      <div className="auto-play-toggle">
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
