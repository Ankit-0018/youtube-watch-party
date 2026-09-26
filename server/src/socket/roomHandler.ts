import { Server } from "socket.io";
import type { JoinRoomPayload, WatchPartySocket } from "../types/socket.js";
import type { RoomManager } from "../rooms/roomManager.js";
import { SERVER_EVENTS } from "../constants/socketEvents.js";
import type { Participant } from "../types/participants.js";
import { ROLES } from "../constants/roles.js";

export function registerRoomHandlers(
  io: Server,
  socket: WatchPartySocket,
  roomManager: RoomManager,
) {
  socket.on("join_room", (payload: JoinRoomPayload) => {
    handleJoinRoom(io, socket, roomManager, payload);
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
