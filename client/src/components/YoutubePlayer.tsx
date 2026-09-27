import { useEffect, useRef } from "react";

interface YouTubePlayerProps {
  videoId: string | null;
  onReady?: (player: YT.Player) => void;
}

export default function YouTubePlayer({
  videoId,
  onReady,
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const playerRef = useRef<YT.Player | null>(null);

  useEffect(() => {
    if (!videoId || !containerRef.current) {
      return;
    }

    function createPlayer() {
      if (!containerRef.current) {
        return;
      }

      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          playsinline: 1,
          controls: 1,
        },
        events: {
          onReady: (event) => {
            onReady?.(event.target);
          },
        },
      });
    }

    if (window.YT) {
      createPlayer();
      return;
    }

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

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId, onReady]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        aspectRatio: "16 / 9",
      }}
    />
  );
}
