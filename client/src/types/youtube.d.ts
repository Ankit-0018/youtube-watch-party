interface YTPlayerEvent {
  target: YT.Player;
  data: number;
}

declare namespace YT {
  class Player {
    constructor(
      element: HTMLElement | string,
      options: {
        videoId?: string;
        playerVars?: {
          autoplay?: number;
          controls?: number;
          playsinline?: number;
          disablekb?: number;
          fs?: number;
          rel?: number;
        };
        events?: {
          onReady?: (event: YTPlayerEvent) => void;
          onStateChange?: (event: YTPlayerEvent) => void;
        };
      },
    );

    playVideo(): void;
    pauseVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;

    loadVideoById(videoId: string, startSeconds?: number): void;

    getDuration(): number;
    getCurrentTime(): number;
    getPlayerState(): number;
    destroy(): void;
  }

  namespace PlayerState {
    const UNSTARTED: number;
    const ENDED: number;
    const PLAYING: number;
    const PAUSED: number;
    const BUFFERING: number;
    const CUED: number;
  }
}

interface Window {
  YT: typeof YT | undefined;

  onYouTubeIframeAPIReady: (() => void) | undefined;
}
