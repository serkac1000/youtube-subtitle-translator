// Type definitions for YouTube IFrame API
// This handles the YouTube IFrame API types that TypeScript doesn't natively include

interface Window {
  YT: typeof YT;
  onYouTubeIframeAPIReady: () => void;
}

/**
 * YouTube player API namespace
 */
declare namespace YT {
  /**
   * YouTube player states
   */
  export enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5
  }

  /**
   * YouTube player instance
   */
  export interface Player {
    // Video control methods
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    seekTo(seconds: number, allowSeekAhead?: boolean): void;
    clearVideo(): void;
    
    // Video info methods
    getDuration(): number;
    getCurrentTime(): number;
    getVideoLoadedFraction(): number;
    getVideoStartBytes(): number;
    getVideoUrl(): string;
    getPlayerState(): number;
    
    // Playback control
    mute(): void;
    unMute(): void;
    isMuted(): boolean;
    setVolume(volume: number): void;
    getVolume(): number;
    setSize(width: number, height: number): object;
    getPlaybackRate(): number;
    setPlaybackRate(suggestedRate: number): void;
    getAvailablePlaybackRates(): number[];
    setLoop(loopPlaylists: boolean): void;
    setShuffle(shufflePlaylist: boolean): void;
    
    // Events
    addEventListener(event: string, listener: string | Function): void;
    removeEventListener(event: string, listener: string | Function): void;
    
    // DOM
    getIframe(): HTMLIFrameElement;
    destroy(): void;
  }

  /**
   * YouTube player constructor options
   */
  export interface PlayerOptions {
    videoId?: string;
    playerVars?: {
      autoplay?: 0 | 1;
      cc_load_policy?: 0 | 1;
      cc_lang_pref?: string;
      color?: 'red' | 'white';
      controls?: 0 | 1 | 2;
      disablekb?: 0 | 1;
      enablejsapi?: 0 | 1;
      end?: number;
      fs?: 0 | 1;
      hl?: string;
      iv_load_policy?: 1 | 3;
      list?: string;
      listType?: 'playlist' | 'search' | 'user_uploads';
      loop?: 0 | 1;
      modestbranding?: 0 | 1;
      origin?: string;
      playlist?: string;
      playsinline?: 0 | 1;
      rel?: 0 | 1;
      showinfo?: 0 | 1;
      start?: number;
      mute?: 0 | 1;
    };
    height?: number | string;
    width?: number | string;
    events?: {
      onReady?: (event: PlayerEvent) => void;
      onStateChange?: (event: OnStateChangeEvent) => void;
      onPlaybackQualityChange?: (event: any) => void;
      onPlaybackRateChange?: (event: any) => void;
      onError?: (event: any) => void;
      onApiChange?: (event: any) => void;
    };
  }

  /**
   * Player event base interface
   */
  export interface PlayerEvent {
    target: Player;
  }

  /**
   * State change event
   */
  export interface OnStateChangeEvent extends PlayerEvent {
    data: PlayerState;
  }

  /**
   * Player constructor
   */
  export interface PlayerConstructor {
    new (element: HTMLElement | string, options: PlayerOptions): Player;
  }
}

/**
 * YouTube API
 */
declare var YT: {
  Player: YT.PlayerConstructor;
  PlayerState: typeof YT.PlayerState;
};