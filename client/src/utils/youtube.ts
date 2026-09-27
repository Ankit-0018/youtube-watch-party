export function extractYouTubeVideoId(value: string): string | null {
  const input = value.trim();

  if (!input) {
    return null;
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  try {
    const url = new URL(input);

    if (url.hostname === "youtube.com" || url.hostname === "www.youtube.com") {
      const videoId = url.searchParams.get("v");

      if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return videoId;
      }
    }

    if (url.hostname === "youtu.be") {
      const videoId = url.pathname.slice(1);

      if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return videoId;
      }
    }
  } catch {
    return null;
  }

  return null;
}
