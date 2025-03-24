export interface SubtitleCue {
  id: string;
  start: number;
  end: number;
  text: string;
}

export interface SubtitleTrack {
  id: string;
  language: string;
  label: string;
  cues: SubtitleCue[];
  isDefault?: boolean;
}

export interface VideoDetails {
  videoId: string;
  title: string;
  viewCount: string;
  uploadDate: string;
}

export type PlayerState = 'unstarted' | 'ended' | 'playing' | 'paused' | 'buffering' | 'cued';
