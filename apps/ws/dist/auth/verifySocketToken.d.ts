export type SocketTokenPayload = {
    userId: string;
    username?: string;
};
export declare function verifySocketToken(token: string): Promise<SocketTokenPayload>;
//# sourceMappingURL=verifySocketToken.d.ts.map