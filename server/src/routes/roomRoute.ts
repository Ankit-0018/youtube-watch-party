import { Router } from "express";
import type { RoomManager } from "../rooms/roomManager.js";
import { generateRoomCode } from "../utils/roomCode.js";
import { generateUserId } from "../utils/userid.js";
import { ROLES } from "../constants/roles.js";

export function createRoomRoutes(roomManager: RoomManager) {
  const router = Router();

  router.post("/", (_req, res) => {
    const roomId = generateRoomCode();
    const userId = generateUserId();

    const room = roomManager.createRoom(roomId, userId);

    res.status(201).json({
      success: true,
      data: {
        roomId: room.roomId,
        userId,
        role: ROLES.HOST,
      },
    });
  });

  return router;
}
