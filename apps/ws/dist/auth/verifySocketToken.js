import { jwtVerify } from "jose";
import { env } from "../env.js";
function getSecretKey() {
    return new TextEncoder().encode(env.socketTokenSecret);
}
export async function verifySocketToken(token) {
    const { payload } = await jwtVerify(token, getSecretKey(), {
        algorithms: ["HS256"],
    });
    const userId = payload.userId;
    if (typeof userId !== "string" || userId.length === 0) {
        throw new Error("Invalid token payload: missing userId");
    }
    const username = payload.username;
    return {
        userId,
        username: typeof username === "string" ? username : undefined,
    };
}
//# sourceMappingURL=verifySocketToken.js.map