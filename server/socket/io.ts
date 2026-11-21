import type { Server as SocketIOServer } from "socket.io";

const g = globalThis as unknown as { __io?: SocketIOServer };

export function setIO(server: SocketIOServer) {
  g.__io = server;
}

export function getIO() {
  if (!g.__io) {
    throw new Error("Socket.IO server is not initialized");
  }

  return g.__io;
}