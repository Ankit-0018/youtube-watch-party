import { useEffect, useRef } from "react";

interface YouTubePlayerProps {
  videoId: string | null;
  onReady?: (player: YT.Player) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
}

export default function YouTubePlayer({
  videoId,
  onReady,
  onTimeUpdate,
  onDurationChange,
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);

  const loadedVideoIdRef = useRef<string | null>(null);

  const onReadyRef = useRef(onReady);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onDurationChangeRef = useRef(onDurationChange);

  useEffect(() => {
    onReadyRef.current = onReady;
    onTimeUpdateRef.current = onTimeUpdate;
    onDurationChangeRef.current = onDurationChange;
  }, [onReady, onTimeUpdate, onDurationChange]);

  // Create the YouTube player once
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    function createPlayer() {
      if (!containerRef.current || playerRef.current) {
        return;
      }

      playerRef.current = new YT.Player(containerRef.current, {
        videoId: videoId ?? undefined,

        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          rel: 0,
        },

        events: {
          onReady: (event) => {
            const player = event.target;

            loadedVideoIdRef.current = videoId;

            onReadyRef.current?.(player);

            const duration = player.getDuration();

            if (duration > 0) {
              onDurationChangeRef.current?.(duration);
            }
          },
        },
      });
    }

    if (window.YT) {
      createPlayer();
    } else {
      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]',
      );

      if (!existingScript) {
        const script = document.createElement("script");

        script.src = "https://www.youtube.com/iframe_api";

        document.body.appendChild(script);
      }

      const previousCallback = window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady = () => {
        previousCallback?.();
        createPlayer();
      };
    }

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  // Load a new video into the existing player
  useEffect(() => {
    const player = playerRef.current;

    if (!player || !videoId) {
      return;
    }

    if (loadedVideoIdRef.current === videoId) {
      return;
    }

    console.log("Loading new YouTube video:", videoId);

    loadedVideoIdRef.current = videoId;

    player.loadVideoById(videoId, 0);

    onTimeUpdateRef.current?.(0);
    onDurationChangeRef.current?.(0);
  }, [videoId]);

  // Track playback position locally
  useEffect(() => {
    const interval = window.setInterval(() => {
      const player = playerRef.current;

      if (!player) {
        return;
      }

      const currentTime = player.getCurrentTime();

      const duration = player.getDuration();

      if (Number.isFinite(currentTime)) {
        onTimeUpdateRef.current?.(currentTime);
      }

      if (Number.isFinite(duration) && duration > 0) {
        onDurationChangeRef.current?.(duration);
      }
    }, 250);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 9",
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
