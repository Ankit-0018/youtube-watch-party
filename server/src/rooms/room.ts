import { type Participant } from "../types/participants.js";
import { type PlaybackState, type RoomState } from "../types/room.js";

export class Room {
  public participants = new Map<string, Participant>();

  public playback: PlaybackState = {
    videoId: "M7lc1UVf-VE",
    playState: "PAUSED",
    currentTime: 0,
    updatedAt: Date.now(),
  };

  constructor(
    public readonly roomId: string,
    public hostId: string,
  ) {}

  addParticipant(participant: Participant) {
    this.participants.set(participant.userId, participant);
  }

  removeParticipant(userId: string) {
    this.participants.delete(userId);
  }

  getParticipant(userId: string) {
    return this.participants.get(userId);
  }

  getParticipantBySocketId(socketId: string) {
    return [...this.participants.values()].find(
      (participant) => participant.socketId === socketId,
    );
  }

  getParticipants() {
    return [...this.participants.values()];
  }

  play(currentTime: number) {
    this.playback = {
      ...this.playback,
      playState: "PLAYING",
      currentTime,
      updatedAt: Date.now(),
    };
  }

  pause(currentTime: number) {
    this.playback = {
      ...this.playback,
      playState: "PAUSED",
      currentTime,
      updatedAt: Date.now(),
    };
  }

  getState(): RoomState {
    return {
      roomId: this.roomId,
      hostId: this.hostId,
      playback: this.playback,
      participants: this.getParticipants(),
    };
  }
}
