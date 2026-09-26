import { Router } from "express";
import { generateRoomCode } from "../utils/roomCode.js";
import { ROLES } from "../constants/roles.js";
import { generateUserId } from "../utils/userId.js";
import { roomManager } from "../rooms/roomManager.js";

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

export default router;
