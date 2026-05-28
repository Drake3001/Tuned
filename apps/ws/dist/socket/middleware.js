import { verifySocketToken } from "../auth/verifySocketToken.js";
export function registerAuthMiddleware(io) {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (typeof token !== "string" || token.length === 0) {
                return next(new Error("UNAUTHORIZED"));
            }
            const payload = await verifySocketToken(token);
            socket.data.userId = payload.userId;
            socket.data.username = payload.username;
            next();
        }
        catch {
            next(new Error("UNAUTHORIZED"));
        }
    });
}
//# sourceMappingURL=middleware.js.map