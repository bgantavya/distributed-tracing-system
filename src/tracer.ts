import crypto from "node:crypto";
import type { AppRequest } from "../utils/types";
import type { NextFunction, Response } from "express";
import { addTrace } from "./db";

export const traceRequest = (req: AppRequest, res: Response, next: NextFunction) => {
	const startTime = Date.now();
	const traceId = crypto.randomUUID();
	req.traceId = traceId;
	req.startTime = startTime;
	res.setHeader("X-Trace-Id", traceId);

	res.on("finish", () => {
		const durationMs = Date.now() - startTime;
		addTrace({
			id: traceId,
			method: req.method,
			Paths: req.originalUrl,
			statusCode: res.statusCode,
			startTime,
			durationMs,
			userId: req.user?.id ?? req.authenticatedUser?.id,
		});
	});
    
	next();
};
