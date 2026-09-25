import { type Role } from "../constants/roles.js";

export interface Participant {
  userId: string;
  socketId: string;
  username: string;
  role: Role;
}
