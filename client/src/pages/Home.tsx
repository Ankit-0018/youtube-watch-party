import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom } from "../services/roomApi";
import { generateUserId } from "../utils/userId";
import { saveRoomUser } from "../utils/storage";

export default function Home() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreateRoom() {
    if (!username.trim()) {
      setError("Please enter your name");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const room = await createRoom();

      saveRoomUser(room.roomId, room.userId, username.trim());

      navigate(`/room/${room.roomId}`);
    } catch (error) {
      console.error(error);
      setError("Failed to create room");
    } finally {
      setLoading(false);
    }
  }

  function handleJoinRoom() {
    if (!username.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!roomId.trim()) {
      setError("Please enter a room code");
      return;
    }

    const normalizedRoomId = roomId.trim().toUpperCase();

    const userId = generateUserId();

    saveRoomUser(normalizedRoomId, userId, username.trim());

    navigate(`/room/${normalizedRoomId}`);
  }

  return (
    <main>
      <h1>YouTube Watch Party</h1>

      <input
        type="text"
        placeholder="Your name"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
      />

      <div>
        <button onClick={handleCreateRoom} disabled={loading}>
          {loading ? "Creating..." : "Create Room"}
        </button>
      </div>

      <hr />

      <input
        type="text"
        placeholder="Room code"
        value={roomId}
        onChange={(event) => setRoomId(event.target.value)}
      />

      <button onClick={handleJoinRoom}>Join Room</button>

      {error && <p>{error}</p>}
    </main>
  );
}
