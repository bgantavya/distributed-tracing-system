import { AppRequest } from "./utils/types.js";
import { NextFunction, Response } from "express";
import { users } from "./utils/constant.js";
import { AppError } from "./utils/errors.js";
import { getTraces } from "./Tracer/store.js";

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

export const loadStats = async (req: AppRequest, res: Response, next: NextFunction) => {
    try {
        req.traces = await getTraces();
        next();
    } catch (error) {
        next(new AppError("Unable to load traces", 500, "TRACE_LOAD_ERROR"));
    }
};

export const loadTest = (req: AppRequest, res: Response, next: NextFunction) => {
    const {url}: any  = req.query
    fetch(url).then((data) => req.data = data).catch((err) => req.data = err).finally(() => next())
    console.log(url)
}
