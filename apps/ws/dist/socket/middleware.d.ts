import type { Server } from "socket.io";
declare module "socket.io" {
    interface SocketData {
        userId: string;
        username?: string;
    }
}
export declare function registerAuthMiddleware(io: Server): void;
//# sourceMappingURL=middleware.d.ts.map