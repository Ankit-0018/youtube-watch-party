import { Room } from "./room.js";

export class RoomManager {
  private rooms = new Map<string, Room>();

  createRoom(roomId: string, hostId: string) {
    if (this.rooms.has(roomId)) {
      throw new Error("Room already exists");
    }

    const room = new Room(roomId, hostId);

    this.rooms.set(roomId, room);
    console.log("ROOM CREATED:", roomId, "TOTAL ROOMS:", this.rooms.size);

    return room;
  }

  getRoom(roomId: string) {
    console.log("ROOM LOOKUP:", roomId, "FOUND:", [...this.rooms.keys()]);
    return this.rooms.get(roomId);
  }

  hasRoom(roomId: string) {
    return this.rooms.has(roomId);
  }

  deleteRoom(roomId: string) {
    this.rooms.delete(roomId);
  }
}

export const roomManager = new RoomManager();
