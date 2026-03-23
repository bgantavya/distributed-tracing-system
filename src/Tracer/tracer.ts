import {randomUUID} from "node:crypto";
import { AppRequest } from "../utils/types.js";
import type { NextFunction, Response } from "express";
import { addTrace } from "./store.js";
import { Paths } from "../utils/constant.js";

export const traceRequest = (req: AppRequest, res: Response, next: NextFunction) => {
	if (req.path === "/favicon.ico" || req.path.startsWith(Paths.logs.base())) {
		next();
		return;
	}

	const startTime = Date.now();
	const traceId = randomUUID();
	req.startTime = startTime;
	res.setHeader("X-Trace-Id", traceId);
	
	res.on("finish", () => {
		const durationMs = Date.now() - startTime;
		addTrace({
			id: traceId,
			method: req.method,
			path: req.originalUrl,
			statusCode: res.statusCode,
			startTime,
			durationMs,
			userId: req.user?.id ?? req.authenticatedUser?.id,
			ip: req.ip,
		});
	});
    
	next();
};
