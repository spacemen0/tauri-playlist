export interface TrackData {
  id: number;
  title: string;
  artist: string;
  album: string;
  genre: string;
  length: number;
  path: string;
}

export interface PlaylistData {
  id: number;
  title: string;
  description: string;
  tracks: TrackData[];
}
