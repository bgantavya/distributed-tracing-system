import type { AppRequest } from "./utils/types";
import type { NextFunction, Response } from "express";
import { users } from "./utils/users";
import { AppError } from "./utils/errors";

export const authenticate = (req: AppRequest, res: Response, next: NextFunction) => {
    req.authenticatedUser = users[0];
    next();
}

export const andRestrictToSelf = (req: AppRequest, res: Response, next: NextFunction) => {
    if (req.authenticatedUser && req.user && req.authenticatedUser.id === req.user.id) {
        next();
    } else {
        next(new AppError("Unauthorized", 403, "FORBIDDEN"));
    }
}

export const andRestrictTo = (role: string) => {
    return (req: AppRequest, res: Response, next: NextFunction) => {
        if (req.authenticatedUser && req.authenticatedUser.role === role) {
            next();
        } else {
            next(new AppError("Unauthorized", 403, "FORBIDDEN"));
        }
    }
}
