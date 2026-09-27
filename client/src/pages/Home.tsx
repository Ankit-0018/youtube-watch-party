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
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
        <div className="grid w-full gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left - Hero */}
          <section>
            <div className="mb-6 inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-sm text-zinc-400">
              Watch together, from anywhere
            </div>

            <h1 className="max-w-xl text-5xl font-bold tracking-tight sm:text-6xl">
              Your friends.
              <br />
              Your videos.
              <br />
              <span className="text-zinc-400">One party.</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-zinc-400">
              Create a room, invite your friends, and watch YouTube together
              with synchronized playback.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 text-sm text-zinc-400">
              <span>● Synchronized playback</span>
              <span>● Real-time rooms</span>
              <span>● Host controls</span>
            </div>
          </section>

          {/* Right - Card */}
          <section className="mx-auto w-full max-w-md">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold">Start a watch party</h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Create a new room or join an existing one.
                </p>
              </div>

              {/* Username */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Your name
                </label>

                <input
                  type="text"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-500"
                />
              </div>

              {/* Create */}
              <button
                onClick={handleCreateRoom}
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating room..." : "Create a room"}
              </button>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-zinc-800" />
                <span className="text-xs uppercase tracking-wider text-zinc-600">
                  or
                </span>
                <div className="h-px flex-1 bg-zinc-800" />
              </div>

              {/* Room code */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Room code
                </label>

                <input
                  type="text"
                  placeholder="Enter room code"
                  value={roomId}
                  onChange={(event) => setRoomId(event.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm uppercase text-white outline-none transition placeholder:normal-case placeholder:text-zinc-600 focus:border-zinc-500"
                />
              </div>

              <button
                onClick={handleJoinRoom}
                className="mt-3 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
              >
                Join room
              </button>

              {/* Error */}
              {error && (
                <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
                  {error}
                </div>
              )}
            </div>

            <p className="mt-4 text-center text-xs text-zinc-600">
              No account required
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
