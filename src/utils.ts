import type { Request } from "express";

export type Trace = {
    id: string;
    method: string;
    path: string;
    statusCode: number;
    startTime: number;
    durationMs: number;
    userId?: number;
    userAgent?: string;
    ip?: string;
};

export type AppRequest = Request & {
    startTime?: number;
    delaySeconds?: number;
    data?: unknown;
};

declare global {
    namespace Express {
        interface Request {
            startTime?: number;
            delaySeconds?: number;
        }
    }
}
export const Paths = {
    logs: () => '/logs',
    test: () => '/test',
    delay: () => '/delay/:t',
    status: () => '/status/:code',
};