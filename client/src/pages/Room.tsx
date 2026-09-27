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

  const playerRef = useRef<YT.Player | null>(null);

  useEffect(() => {
    if (!roomId || !userId || !username) {
      return;
    }

    socket.connect();

    function handleSyncState(state: RoomState) {
      console.log("Sync state:", state);

      setRoom(state);

      const player = playerRef.current;

      if (!player || !state.playback.videoId) {
        return;
      }

      player.seekTo(state.playback.currentTime, true);

      if (state.playback.playState === "PLAYING") {
        player.playVideo();
      } else {
        player.pauseVideo();
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
        if (!current) return current;

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
        if (!current) return current;

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
        }}
      />

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
