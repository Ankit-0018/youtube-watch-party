import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import roomRoutes from "./routes/roomRoute.js";
import { errorHandler } from "./utils/errorHandler.js";
import type { WatchPartySocket } from "./types/socket.js";
import {
  handleDisconnect,
  registerRoomHandlers,
} from "./socket/roomHandler.js";
import { roomManager } from "./rooms/roomManager.js";

dotenv.config();

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Watch Party server is running",
  });
});

app.use("/api/rooms", roomRoutes);
app.use(errorHandler);

io.on("connection", (socket) => {
  const watchPartySocket = socket as WatchPartySocket;

  console.log(`Socket connected: ${socket.id}`);

  registerRoomHandlers(io, watchPartySocket, roomManager);

  socket.on("disconnect", () => {
    handleDisconnect(io, watchPartySocket, roomManager);
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
