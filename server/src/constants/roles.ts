export const ROLES = {
  HOST: "HOST",
  MODERATOR: "MODERATOR",
  PARTICIPANT: "PARTICIPANT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
