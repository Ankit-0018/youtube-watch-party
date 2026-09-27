const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

interface CreateRoomResponse {
  success: boolean;
  data: {
    roomId: string;
    userId: string;
    role: "HOST";
  };
}

export async function createRoom() {
  const response = await fetch(`${SERVER_URL}/api/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to create room");
  }

  const data: CreateRoomResponse = await response.json();

  return data.data;
}
