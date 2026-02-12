import type { NextFunction, Request } from "express";
import { RoleTypes } from "./enums";

export type UserProps = {
    id: number;
    name: string;
    email: string;
    role: RoleTypes;
};

export type ExpProps = {
    req: Request;
    res: Response;
    next: NextFunction;
} 
export type ViewProps = {
    req: Request,
    res: Response,
} 



declare global {
    namespace Express {
        interface Request {
            user?: UserProps;
            authenticatedUser?: UserProps;
        }
    }
}