import crypto from "crypto";

export function generateUserId() {
  return crypto.randomUUID();
}
