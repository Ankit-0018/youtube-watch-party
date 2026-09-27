import { Server } from "socket.io";
import type {
  ChangeVideoPayload,
  JoinRoomPayload,
  PlaybackActionPayload,
  ReactionPayload,
  TransferHostPayload,
  WatchPartySocket,
} from "../types/socket.js";
import type { RoomManager } from "../rooms/roomManager.js";
import { CLIENT_EVENTS, SERVER_EVENTS } from "../constants/socketEvents.js";
import type { Participant } from "../types/participants.js";
import { ROLES } from "../constants/roles.js";
import { hasPermission } from "../types/permission.js";

export function registerRoomHandlers(
  io: Server,
  socket: WatchPartySocket,
  roomManager: RoomManager,
) {
  socket.on("join_room", (payload: JoinRoomPayload) => {
    handleJoinRoom(io, socket, roomManager, payload);
  });

  socket.on("leave_room", () => {
    handleLeaveRoom(io, socket, roomManager);
  });
  socket.on(CLIENT_EVENTS.PLAY, (payload: PlaybackActionPayload = {}) => {
    handlePlay(io, socket, roomManager, payload);
  });

  socket.on(CLIENT_EVENTS.PAUSE, (payload: PlaybackActionPayload = {}) => {
    handlePause(io, socket, roomManager, payload);
  });

  socket.on(CLIENT_EVENTS.SEEK, (payload: PlaybackActionPayload) => {
    handleSeek(io, socket, roomManager, payload);
  });
  socket.on(CLIENT_EVENTS.CHANGE_VIDEO, (payload: ChangeVideoPayload) => {
    handleChangeVideo(io, socket, roomManager, payload);
  });

  socket.on(CLIENT_EVENTS.TRANSFER_HOST, (payload: TransferHostPayload) => {
    handleTransferHost(io, socket, roomManager, payload);
  });

  socket.on(CLIENT_EVENTS.REACTION, (payload: ReactionPayload) => {
    handleReaction(io, socket, roomManager, payload);
  });
}

function handleJoinRoom(
  io: Server,
  socket: WatchPartySocket,
  roomManager: RoomManager,
  payload: JoinRoomPayload,
) {
  const { roomId, userId, username } = payload;

  const room = roomManager.getRoom(roomId);

  if (!room) {
    socket.emit(SERVER_EVENTS.ERROR, {
      code: "ROOM_NOT_FOUND",
      message: "Room does not exist",
    });

    return;
  }

  if (!username?.trim()) {
    socket.emit(SERVER_EVENTS.ERROR, {
      code: "INVALID_USERNAME",
      message: "Username is required",
    });

    return;
  }

  if (room.getParticipant(userId)) {
    socket.emit(SERVER_EVENTS.ERROR, {
      code: "ALREADY_IN_ROOM",
      message: "User is already in this room",
    });

    return;
  }

  const isHost = room.hostId === userId;

  const participant: Participant = {
    userId,
    socketId: socket.id,
    username: username.trim(),
    role: isHost ? ROLES.HOST : ROLES.PARTICIPANT,
  };

  room.addParticipant(participant);

  socket.join(roomId);

  socket.roomId = roomId;
  socket.userId = userId;

  socket.emit(SERVER_EVENTS.SYNC_STATE, room.getState());

  socket.to(roomId).emit(SERVER_EVENTS.USER_JOINED, {
    username: participant.username,
    userId: participant.userId,
    role: participant.role,
    participants: room.getParticipants(),
  });

  console.log(`${participant.username} joined room ${roomId}`);
}

function handleLeaveRoom(
  io: Server,
  socket: WatchPartySocket,
  roomManager: RoomManager,
) {
  const roomId = socket.roomId;
  const userId = socket.userId;

  if (!roomId || !userId) {
    return;
  }

  const room = roomManager.getRoom(roomId);

  if (!room) {
    return;
  }

  const participant = room.getParticipant(userId);

  if (!participant) {
    return;
  }

  room.removeParticipant(userId);

  socket.leave(roomId);

  socket.roomId = undefined;
  socket.userId = undefined;

  io.to(roomId).emit(SERVER_EVENTS.USER_LEFT, {
    username: participant.username,
    userId: participant.userId,
    participants: room.getParticipants(),
  });

  console.log(`${participant.username} left room ${roomId}`);

  cleanupRoom(roomId, roomManager);
}
function cleanupRoom(roomId: string, roomManager: RoomManager) {
  const room = roomManager.getRoom(roomId);

  if (!room) return;

  console.log(`Room ${roomId} is empty but remains active`);
}
export function handleDisconnect(
  io: Server,
  socket: WatchPartySocket,
  roomManager: RoomManager,
) {
  const roomId = socket.roomId;
  const userId = socket.userId;

  if (!roomId || !userId) {
    return;
  }

  const room = roomManager.getRoom(roomId);

  if (!room) {
    return;
  }

  const participant = room.getParticipant(userId);

  if (!participant) {
    return;
  }

  room.removeParticipant(userId);

  io.to(roomId).emit(SERVER_EVENTS.USER_LEFT, {
    username: participant.username,
    userId: participant.userId,
    participants: room.getParticipants(),
  });

  console.log(`${participant.username} disconnected from ${roomId}`);

  cleanupRoom(roomId, roomManager);
}

function handlePlay(
  io: Server,
  socket: WatchPartySocket,
  roomManager: RoomManager,
  payload: PlaybackActionPayload,
) {
  const roomId = socket.roomId;
  const userId = socket.userId;

  if (!roomId || !userId) {
    return;
  }

  const room = roomManager.getRoom(roomId);

  if (!room) {
    socket.emit(SERVER_EVENTS.ERROR, {
      code: "ROOM_NOT_FOUND",
      message: "Room does not exist",
    });

    return;
  }

  const participant = room.getParticipant(userId);

  if (!participant) {
    socket.emit(SERVER_EVENTS.ERROR, {
      code: "NOT_IN_ROOM",
      message: "You are not a participant in this room",
    });

    return;
  }

  if (!hasPermission(participant.role, "PLAY")) {
    socket.emit(SERVER_EVENTS.ERROR, {
      code: "FORBIDDEN",
      message: "You do not have permission to play the video",
    });

    return;
  }

  const currentTime =
    typeof payload.currentTime === "number"
      ? payload.currentTime
      : room.playback.currentTime;

  room.play(currentTime);

  io.to(roomId).emit(SERVER_EVENTS.SYNC_STATE, room.getState());
}

function handlePause(
  io: Server,
  socket: WatchPartySocket,
  roomManager: RoomManager,
  payload: PlaybackActionPayload,
) {
  const roomId = socket.roomId;
  const userId = socket.userId;

  if (!roomId || !userId) {
    return;
  }

  const room = roomManager.getRoom(roomId);

  if (!room) {
    socket.emit(SERVER_EVENTS.ERROR, {
      code: "ROOM_NOT_FOUND",
      message: "Room does not exist",
    });

    return;
  }

  const participant = room.getParticipant(userId);

  if (!participant) {
    socket.emit(SERVER_EVENTS.ERROR, {
      code: "NOT_IN_ROOM",
      message: "You are not a participant in this room",
    });

    return;
  }

  if (!hasPermission(participant.role, "PAUSE")) {
    socket.emit(SERVER_EVENTS.ERROR, {
      code: "FORBIDDEN",
      message: "You do not have permission to pause the video",
    });

    return;
  }

  const currentTime =
    typeof payload.currentTime === "number"
      ? payload.currentTime
      : room.playback.currentTime;

  room.pause(currentTime);

  io.to(roomId).emit(SERVER_EVENTS.SYNC_STATE, room.getState());
}

function handleSeek(
  io: Server,
  socket: WatchPartySocket,
  roomManager: RoomManager,
  payload: PlaybackActionPayload,
) {
  const roomId = socket.roomId;
  const userId = socket.userId;

  if (!roomId || !userId) {
    return;
  }

  const room = roomManager.getRoom(roomId);

  if (!room) {
    socket.emit(SERVER_EVENTS.ERROR, {
      code: "ROOM_NOT_FOUND",
      message: "Room does not exist",
    });

    return;
  }

  const participant = room.getParticipant(userId);

  if (!participant) {
    socket.emit(SERVER_EVENTS.ERROR, {
      code: "NOT_IN_ROOM",
      message: "You are not a participant in this room",
    });

    return;
  }

  if (!hasPermission(participant.role, "SEEK")) {
    socket.emit(SERVER_EVENTS.ERROR, {
      code: "FORBIDDEN",
      message: "You do not have permission to seek",
    });

    return;
  }

  const currentTime = payload.currentTime;

  if (
    typeof currentTime !== "number" ||
    !Number.isFinite(currentTime) ||
    currentTime < 0
  ) {
    socket.emit(SERVER_EVENTS.ERROR, {
      code: "INVALID_SEEK_TIME",
      message: "Invalid seek position",
    });

    return;
  }

  room.seek(currentTime);

  io.to(roomId).emit(SERVER_EVENTS.SYNC_STATE, room.getState());
}

function handleChangeVideo(
  io: Server,
  socket: WatchPartySocket,
  roomManager: RoomManager,
  payload: ChangeVideoPayload,
) {
  const roomId = socket.roomId;
  const userId = socket.userId;

  if (!roomId || !userId) {
    return;
  }

  const room = roomManager.getRoom(roomId);

  if (!room) {
    socket.emit(SERVER_EVENTS.ERROR, {
      code: "ROOM_NOT_FOUND",
      message: "Room does not exist",
    });

    return;
  }

  const participant = room.getParticipant(userId);

  if (!participant) {
    socket.emit(SERVER_EVENTS.ERROR, {
      code: "NOT_IN_ROOM",
      message: "You are not a participant in this room",
    });

    return;
  }

  if (!hasPermission(participant.role, "CHANGE_VIDEO")) {
    socket.emit(SERVER_EVENTS.ERROR, {
      code: "FORBIDDEN",
      message: "You do not have permission to change the video",
    });

    return;
  }

  const videoId = payload?.videoId?.trim();

  if (!videoId) {
    socket.emit(SERVER_EVENTS.ERROR, {
      code: "INVALID_VIDEO_ID",
      message: "A valid YouTube video ID is required",
    });

    return;
  }

  room.changeVideo(videoId);

  io.to(roomId).emit(SERVER_EVENTS.SYNC_STATE, room.getState());
}

function handleTransferHost(
  io: Server,
  socket: WatchPartySocket,
  roomManager: RoomManager,
  payload: TransferHostPayload,
) {
  const roomId = socket.roomId;
  const userId = socket.userId;

  if (!roomId || !userId) {
    return;
  }

  const room = roomManager.getRoom(roomId);

  if (!room) {
    socket.emit(SERVER_EVENTS.ERROR, {
      code: "ROOM_NOT_FOUND",
      message: "Room does not exist",
    });

    return;
  }

  // Only the current host can transfer ownership
  if (room.hostId !== userId) {
    socket.emit(SERVER_EVENTS.ERROR, {
      code: "FORBIDDEN",
      message: "Only the host can transfer host role",
    });

    return;
  }

  const targetParticipant = room.getParticipant(payload.userId);

  if (!targetParticipant) {
    socket.emit(SERVER_EVENTS.ERROR, {
      code: "PARTICIPANT_NOT_FOUND",
      message: "Participant does not exist",
    });

    return;
  }

  if (payload.userId === userId) {
    return;
  }

  room.transferHost(payload.userId);

  io.to(roomId).emit(SERVER_EVENTS.SYNC_STATE, room.getState());
}

function handleReaction(
  io: Server,
  socket: WatchPartySocket,
  roomManager: RoomManager,
  payload: ReactionPayload,
) {
  const roomId = socket.roomId;
  const userId = socket.userId;

  if (!roomId || !userId) {
    return;
  }

  const room = roomManager.getRoom(roomId);

  if (!room) {
    return;
  }

  const participant = room.getParticipant(userId);

  if (!participant) {
    return;
  }

  const allowedReactions = ["❤️", "😂", "😮", "🔥", "👍", "👎"];

  if (!allowedReactions.includes(payload.emoji)) {
    return;
  }

  io.to(roomId).emit(SERVER_EVENTS.REACTION, {
    emoji: payload.emoji,
    userId,
    username: participant.username,
  });
}
