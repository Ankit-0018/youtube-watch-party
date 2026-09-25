import crypto from "crypto";

export function generateRoomCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}
