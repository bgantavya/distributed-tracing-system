import { Response, NextFunction } from "express";
import { AppRequest } from "./utils.js";
import { getTraces } from "./tracer.js";

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const showLogs = async (req: AppRequest, res: Response) => {
    const traces = await getTraces();
    const raw = req.params.code;
    const statusCode = raw ? Number(raw) : undefined;

    if (raw && !Number.isFinite(statusCode)) {
        res.status(400).send("Invalid status code");
        return;
    } res.json({ traces });
};

export const testResults = (req: AppRequest, res: Response) => {
    res.json({
            ip: req.ip,
			method: req.method,
			path: req.originalUrl,
			statusCode: res.statusCode,
			startTime:req.startTime,
			durationMs:Date.now() - req.startTime!,
    })
}

export const delayRes = (req: AppRequest, res: Response, next: NextFunction) => {
    const raw = req.params.t;
    const seconds = Number(raw);

    if (!Number.isFinite(seconds) || seconds < 0) {
        next(new AppError("Invalid delay time", 400, "INVALID_DELAY"));
        return;
    }
    req.delaySeconds = seconds;
    setTimeout(() => next(), seconds * 1000);
};