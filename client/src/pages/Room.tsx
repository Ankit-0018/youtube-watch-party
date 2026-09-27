import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

import type { RoomState } from "../types/room";
import { socket } from "../services/socket";
import { getRoomUser } from "../utils/storage";
import YouTubePlayer from "../components/YoutubePlayer";
import { extractYouTubeVideoId } from "../utils/youtube";

interface Reaction {
  id: string;
  userId: string;
  emoji: string;
  username: string;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) {
    return "00:00";
  }

  const totalSeconds = Math.floor(seconds);

  const minutes = Math.floor(totalSeconds / 60);

  const remainingSeconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();

  const roomUser = roomId ? getRoomUser(roomId) : null;

  const userId = roomUser?.userId;
  const username = roomUser?.username;

  const [room, setRoom] = useState<RoomState | null>(null);

  const [playerReady, setPlayerReady] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);

  const [duration, setDuration] = useState(0);

  const [videoUrl, setVideoUrl] = useState("");

  const [reactions, setReactions] = useState<Reaction[]>([]);

  const playerRef = useRef<YT.Player | null>(null);

  const currentParticipant = room?.participants.find(
    (participant) => participant.userId === userId,
  );

  const canControlPlayback =
    currentParticipant?.role === "HOST" ||
    currentParticipant?.role === "MODERATOR";

  useEffect(() => {
    if (!roomId || !userId || !username) {
      return;
    }

    socket.connect();

    function handleSyncState(state: RoomState) {
      console.log("Sync state:", state);

      setRoom(state);

      setCurrentTime(state.playback.currentTime);

      if (state.playback.currentTime === 0) {
        setDuration(0);
      }
    }

    function handleUserJoined(data: {
      username: string;
      userId: string;
      role: string;
      participants: RoomState["participants"];
    }) {
      console.log("User joined:", data);

      setRoom((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          participants: data.participants,
        };
      });
    }

    function handleUserLeft(data: {
      username: string;
      userId: string;
      participants: RoomState["participants"];
    }) {
      console.log("User left:", data);

      setRoom((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          participants: data.participants,
        };
      });
    }

    function handleError(error: { code: string; message: string }) {
      console.error("Socket error:", error);
    }
    function handleReaction(data: {
      emoji: string;
      userId: string;
      username: string;
    }) {
      console.log("Reaction from:", data.username, data.userId);

      const reaction: Reaction = {
        id: crypto.randomUUID(),
        userId: data.userId,
        emoji: data.emoji,
        username: data.username,
      };

      setReactions((prev) => [...prev, reaction]);

      setTimeout(() => {
        setReactions((prev) => prev.filter((item) => item.id !== reaction.id));
      }, 2500);
    }
    socket.on("sync_state", handleSyncState);

    socket.on("user_joined", handleUserJoined);

    socket.on("user_left", handleUserLeft);

    socket.on("error", handleError);

    socket.on("reaction", handleReaction);

    socket.emit("join_room", {
      roomId,
      userId,
      username,
    });

    return () => {
      socket.emit("leave_room");

      socket.off("reaction", handleReaction);

      socket.off("sync_state", handleSyncState);

      socket.off("user_joined", handleUserJoined);

      socket.off("user_left", handleUserLeft);

      socket.off("error", handleError);

      socket.disconnect();
    };
  }, [roomId, userId, username]);

  useEffect(() => {
    const player = playerRef.current;

    if (!playerReady || !player || !room?.playback.videoId) {
      return;
    }

    let syncTime = room.playback.currentTime;

    if (room.playback.playState === "PLAYING") {
      const elapsed = (Date.now() - room.playback.updatedAt) / 1000;

      syncTime += elapsed;
    }

    setCurrentTime(syncTime);

    player.seekTo(syncTime, true);

    if (room.playback.playState === "PLAYING") {
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  }, [room, playerReady]);

  if (!roomId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        Invalid room
      </div>
    );
  }

  if (!roomUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
        <div className="text-center">
          <p className="mb-4 text-zinc-400">
            You are not associated with this room.
          </p>

          <a
            href="/"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
          >
            Go back
          </a>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <p className="text-zinc-400">Joining room...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold">WatchParty</h1>

            <p className="text-xs text-zinc-500">Room {room.roomId}</p>
          </div>

          <button
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm transition hover:bg-zinc-800"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
          >
            Copy Invite
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Left */}
        <section className="min-w-0">
          {/* Video */}
          <div className="relative overflow-hidden rounded-xl bg-black">
            <YouTubePlayer
              videoId={room.playback.videoId}
              onReady={(player) => {
                playerRef.current = player;

                setPlayerReady(true);
              }}
              onTimeUpdate={(time) => {
                setCurrentTime(time);
              }}
              onDurationChange={(videoDuration) => {
                setDuration(videoDuration);
              }}
            />
            {/* Timeline */}
            <div className="bg-zinc-900 px-3 py-3">
              <div className="flex items-center gap-3">
                <span className="w-12 shrink-0 text-xs text-zinc-400">
                  {formatTime(currentTime)}
                </span>

                <input
                  className="h-1 w-full cursor-pointer accent-white disabled:cursor-default"
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={Math.min(currentTime, duration || 0)}
                  disabled={!canControlPlayback}
                  onChange={(event) => {
                    const newTime = Number(event.target.value);

                    setCurrentTime(newTime);
                  }}
                  onMouseUp={(event) => {
                    if (!canControlPlayback) {
                      return;
                    }

                    const newTime = Number(
                      (event.target as HTMLInputElement).value,
                    );

                    socket.emit("seek", {
                      currentTime: newTime,
                    });
                  }}
                  onTouchEnd={(event) => {
                    if (!canControlPlayback) {
                      return;
                    }

                    const newTime = Number(
                      (event.target as HTMLInputElement).value,
                    );

                    socket.emit("seek", {
                      currentTime: newTime,
                    });
                  }}
                />

                <span className="w-12 shrink-0 text-right text-xs text-zinc-400">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Playback buttons */}
              {canControlPlayback && (
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
                    onClick={() => {
                      const player = playerRef.current;

                      if (!player) {
                        return;
                      }

                      socket.emit("play", {
                        currentTime: player.getCurrentTime(),
                      });
                    }}
                  >
                    Play
                  </button>

                  <button
                    className="rounded-lg border border-zinc-700 px-4 py-2 text-sm transition hover:bg-zinc-800"
                    onClick={() => {
                      const player = playerRef.current;

                      if (!player) {
                        return;
                      }

                      socket.emit("pause", {
                        currentTime: player.getCurrentTime(),
                      });
                    }}
                  >
                    Pause
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["❤️", "😂", "😮", "🔥", "👍", "👎"].map((emoji) => (
              <button
                key={emoji}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-lg transition hover:scale-110 hover:bg-zinc-800"
                onClick={() => {
                  socket.emit("reaction", {
                    emoji,
                  });
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
          {/* Change video */}
          {canControlPlayback && (
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="mb-2 text-sm font-medium">Change video</p>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(event) => {
                    setVideoUrl(event.target.value);
                  }}
                  placeholder="Paste YouTube URL"
                  className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-500"
                />

                <button
                  className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
                  onClick={() => {
                    const videoId = extractYouTubeVideoId(videoUrl);

                    if (!videoId) {
                      return;
                    }

                    socket.emit("change_video", {
                      videoId,
                    });

                    setVideoUrl("");
                  }}
                >
                  Change Video
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Participants */}
        <aside className="h-fit rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium">Participants</h2>

            <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-400">
              {room.participants.length}
            </span>
          </div>

          {room.participants.map((participant) => {
            const isCurrentUser = participant.userId === userId;

            const isHost = currentParticipant?.role === "HOST";
            const participantReactions = reactions.filter(
              (reaction) => reaction.userId === participant.userId,
            );

            return (
              <div
                key={participant.userId}
                className="flex items-center justify-between rounded-lg bg-zinc-800/60 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-medium">
                    {participant.username.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm">
                      {participant.username}
                    </span>

                    <div className="flex items-center gap-1">
                      {participantReactions.map((reaction) => (
                        <span
                          key={reaction.id}
                          className="inline-block animate-bounce text-xl"
                          title={`${reaction.username} reacted`}
                        >
                          {reaction.emoji}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase text-zinc-500">
                    {participant.role}
                  </span>

                  {isHost && !isCurrentUser && participant.role !== "HOST" && (
                    <button
                      className="rounded-md border border-zinc-700 px-2 py-1 text-[10px] hover:bg-zinc-700"
                      onClick={() => {
                        socket.emit("transfer_host", {
                          userId: participant.userId,
                        });
                      }}
                    >
                      Make Host
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </aside>
      </div>
    </main>
  );
}
