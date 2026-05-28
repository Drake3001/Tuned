import { createServer } from "node:http";
import { Server } from "socket.io";
import { env } from "./env.js";
import { LobbyManager } from "./lobby/manager.js";
import { registerAuthMiddleware } from "./socket/middleware.js";
import { registerHandlers } from "./socket/handlers.js";
const httpServer = createServer((_req, res) => {
    if (_req.url === "/healthz") {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        return;
    }
    res.writeHead(404);
    res.end();
});
const io = new Server(httpServer, {
    cors: {
        origin: process.env.WS_CORS_ORIGIN ?? "http://localhost:3000",
        credentials: true,
    },
});
const lobbyManager = new LobbyManager(io);
registerAuthMiddleware(io);
registerHandlers(io, lobbyManager);
httpServer.listen(env.wsPort, () => {
    console.log(`[ws] listening on port ${env.wsPort}`);
});
//# sourceMappingURL=index.js.map