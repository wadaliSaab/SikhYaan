import { createServer } from "node:http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { getCurrentUser } from "@/src/lib/auth/session";
import { setIO } from "./io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = Number(process.env.PORT) || 3000;

const app = next({
  dev,
  hostname,
  port,
});

const handle = app.getRequestHandler();

async function startServer() {
  await app.prepare();

  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });

  setIO(io);

  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;

      if (!cookieHeader) {
        return next(new Error("UNAUTHORIZED"));
      }

      const sessionCookie = cookieHeader
        .split(";")
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith("session="));

      const sessionToken = sessionCookie?.split("=")[1];

      if (!sessionToken) {
        return next(new Error("UNAUTHORIZED"));
      }

      const user = await getCurrentUser(sessionToken);

      if (!user) {
        return next(new Error("UNAUTHORIZED"));
      }

      socket.data.user = {
        id: user.id,
        name: user.name,
        role: user.role.name,
      };

      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("SERVER_ERROR"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    const userRoom = `user:${user.id}`;
    const roleRoom = `role:${user.role}`;

    socket.join(userRoom);
    socket.join(roleRoom);

    console.log(
      `Socket connected: ${socket.id} | User: ${user.name} | Role: ${user.role}`
    );

    console.log(
      `Joined rooms: ${userRoom}, ${roleRoom}`
    );

    socket.emit("socket-ready", {
      userId: user.id,
      role: user.role,
    });

    socket.on("disconnect", (reason) => {
      console.log(
        `Socket disconnected: ${socket.id} | Reason: ${reason}`
      );
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Server running at http://${hostname}:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});