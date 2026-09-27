import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

import type { RoomState } from "../types/room";
import { socket } from "../services/socket";
import { getRoomUser } from "../utils/storage";
import YouTubePlayer from "../components/YoutubePlayer";

export default function Room() {
  const { roomId } = useParams<{
    roomId: string;
  }>();

  const roomUser = roomId ? getRoomUser(roomId) : null;

  const userId = roomUser?.userId;
  const username = roomUser?.username;

  const [room, setRoom] = useState<RoomState | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
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

    socket.on("sync_state", handleSyncState);

    socket.on("user_joined", handleUserJoined);

    socket.on("user_left", handleUserLeft);

    socket.on("error", handleError);

    socket.emit("join_room", {
      roomId,
      userId,
      username,
    });

    return () => {
      socket.emit("leave_room");

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

    console.log("Applying playback state:", room.playback);

    player.seekTo(room.playback.currentTime, true);

    if (room.playback.playState === "PLAYING") {
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  }, [room, playerReady]);

  // -----------------------------
  // Render guards
  // -----------------------------

  if (!roomId) {
    return <div>Invalid room</div>;
  }

  if (!roomUser) {
    return (
      <div>
        <p>You are not associated with this room.</p>

        <a href="/">Go back</a>
      </div>
    );
  }

  if (!room) {
    return <div>Joining room...</div>;
  }

  // -----------------------------
  // UI
  // -----------------------------

  return (
    <main>
      <h1>Watch Party</h1>

      <p>
        Room: <strong>{room.roomId}</strong>
      </p>

      <YouTubePlayer
        videoId={room.playback.videoId}
        onReady={(player) => {
          playerRef.current = player;

          setPlayerReady(true);
        }}
      />
      {canControlPlayback && (
        <div>
          <button
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

      <h2>Participants</h2>

      <ul>
        {room.participants.map((participant) => (
          <li key={participant.userId}>
            {participant.username} — {participant.role}
          </li>
        ))}
      </ul>
    </main>
  );
}
