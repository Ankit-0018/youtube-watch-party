export type Role = "HOST" | "MODERATOR" | "PARTICIPANT";

export interface Participant {
  userId: string;
  socketId: string;
  username: string;
  role: Role;
}
