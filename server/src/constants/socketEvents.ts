export const CLIENT_EVENTS = {
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",

  PLAY: "play",
  PAUSE: "pause",
  SEEK: "seek",
  CHANGE_VIDEO: "change_video",

  TRANSFER_HOST: "transfer_host",
  REACTION: "reaction",

  ASSIGN_ROLE: "assign_role",
  REMOVE_PARTICIPANT: "remove_participant",
} as const;

export const SERVER_EVENTS = {
  SYNC_STATE: "sync_state",

  USER_JOINED: "user_joined",
  USER_LEFT: "user_left",

  ROLE_ASSIGNED: "role_assigned",
  PARTICIPANT_REMOVED: "participant_removed",

  REACTION: "reaction",

  ERROR: "error",
} as const;
