import type { AppRequest } from "./utils/types";
import type { NextFunction, Response } from "express";
import { users } from "./utils/users";
import { AppError } from "./utils/errors";
import { getTraces } from "./Tracer/store";

export const loadUser = (req: AppRequest, res: Response, next: NextFunction) => {
    const raw = req.params.id;
    const id = Number(raw);

    if (!raw || !Number.isFinite(id)) {
        next(new AppError("Invalid user id", 400, "INVALID_USER_ID"));
        return;
    }

    const user = users[id];
    if (user) {
        req.user = user;
        next();
    } else {
        next(new AppError("User not found", 404, "USER_NOT_FOUND"));
    }
};

export const loadDo = (req: AppRequest, res: Response, next: NextFunction) => {
    const raw = req.params.t;
    const seconds = Number(raw);

    if (!Number.isFinite(seconds) || seconds < 0) {
        next(new AppError("Invalid delay time", 400, "INVALID_DELAY"));
        return;
    }
    req.delaySeconds = seconds;
    setTimeout(() => next(), seconds * 1000);
};

export const loadStats = (req: AppRequest, res: Response, next: NextFunction) => {
    req.traces = getTraces();
    next();
};
