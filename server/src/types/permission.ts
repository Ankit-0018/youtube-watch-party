import { ROLES, type Role } from "../constants/roles.js";

export const PERMISSIONS = {
  PLAY: [ROLES.HOST, ROLES.MODERATOR],
  PAUSE: [ROLES.HOST, ROLES.MODERATOR],
  SEEK: [ROLES.HOST, ROLES.MODERATOR],
  CHANGE_VIDEO: [ROLES.HOST, ROLES.MODERATOR],
  ASSIGN_ROLE: [ROLES.HOST],
  REMOVE_PARTICIPANT: [ROLES.HOST],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: Role, permission: Permission) {
  return PERMISSIONS[permission].some((allowedRole) => allowedRole === role);
}
