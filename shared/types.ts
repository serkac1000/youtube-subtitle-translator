// Subtitle types used throughout the application
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

// Log entry for debug console
export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'warning' | 'debug' | 'success';
  data?: any;
}

// Speech recognition status
export type RecognitionStatus = 'inactive' | 'listening' | 'error' | 'restarting';
