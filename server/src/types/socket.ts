import { Socket } from "socket.io";

export interface JoinRoomPayload {
  roomId: string;
  userId: string;
  username: string;
}

export interface WatchPartySocket extends Socket {
  roomId?: string | undefined;
  userId?: string | undefined;
}

export interface PlaybackActionPayload {
  currentTime?: number;
}
