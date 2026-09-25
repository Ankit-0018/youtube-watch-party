import { type Participant } from "./participants.js";

export type PlayState = "PLAYING" | "PAUSED";

export interface PlaybackState {
  videoId: string | null;
  playState: PlayState;
  currentTime: number;
  updatedAt: number;
}

export interface RoomState {
  roomId: string;
  hostId: string;
  playback: PlaybackState;
  participants: Participant[];
}
