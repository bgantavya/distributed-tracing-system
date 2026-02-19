import type { Request } from "express";
import { Roles } from "./constant.js";

export type UserProps = {
    id: number;
    name: string;
    email: string;
    role: Roles;
};

export type Trace = {
    id: string;
    method: string;
    path: string;
    statusCode: number;
    startTime: number;
    durationMs: number;
    userId?: number;
};

export type AppRequest = Request & {
    user?: UserProps;
    authenticatedUser?: UserProps;
    traceId?: string;
    startTime?: number;
    delaySeconds?: number;
    traces?: Trace[];
};

declare global {
    namespace Express {
        interface Request {
            user?: UserProps;
            authenticatedUser?: UserProps;
            traceId?: string;
            startTime?: number;
            delaySeconds?: number;
            traces?: Trace[];
        }
    }
}