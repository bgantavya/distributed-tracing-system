import type { NextFunction, Request } from "express";
import { RoleTypes } from "./enums";

export type UserProps = {
    id: number;
    name: string;
    email: string;
    role: RoleTypes;
};

export type Trace = {
    id: string;
    method: string;
    Paths: string;
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

export type ExpProps = {
    req: AppRequest;
    res: Response;
    next: NextFunction;
} 
export type ViewProps = {
    req: AppRequest,
    res: Response,
} 



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