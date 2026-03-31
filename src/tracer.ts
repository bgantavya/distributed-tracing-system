// 1.  **Import the middleware:**
// 2.  **Add the middleware to your Express app:**
//     ```typescript
//     import express from 'express';
//     import { createTraceRequest } from './path/to/tracer';

//     const app = express();

//     // Add traceRequest middleware before your routes
//     app.use(createTraceRequest());

//     // Define your routes

//     const port = 3000;
//     app.listen(port, () => {
//       console.log(`Server listening on port ${port}`);
//     });
//     ```

import policy from "../tracing-policy.json" with { type: "json" };
import { NextFunction, Response } from "express";
import { randomUUID } from "node:crypto";
import type { Request } from "express";

// Request augmentation used by this middleware.
declare global {
    namespace Express {
        interface Request {
            startTime?: number;
        }
    }
}

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

export type TraceHandler = (trace: Trace) => void;

export type TracePolicy = {
    captureSlow: number;
    captureCodes: number[];
};

// Package-level default policy loaded from tracing-policy.json.
const defaultPolicy: TracePolicy = {
    captureSlow: policy.captureSlow,
    captureCodes: policy.captureCodes
};

// ### Configuration Options

// The `createTraceRequest` function accepts an optional configuration object:

// ```typescript
// export type TraceRequestOptions = {
//     onTrace?: (trace: Trace) => void; // Custom handler for each trace
//     saveToMemory?: boolean;           // Whether to store traces in memory (default: true)
//     maxLogs?: number;                 // Maximum number of traces to store in memory (default: 1000)
//     policy?: {                        // Polcy when to log and capture request or let it go
//       captureSlow: number;
//       captureCodes: number[];
//     }
// };
// ```

export type TraceRequestOptions = {
    // Called for every trace that matches policy conditions.
    onTrace?: TraceHandler;
    // Keep traces in process memory for quick retrieval APIs.
    saveToMemory?: boolean;
    // Maximum number of traces retained in memory.
    maxLogs?: number;
    // Optional policy override (partial values merge with defaults).
    policy?: Partial<TracePolicy>;
};

// In-memory trace store (process-local, non-persistent).
const traceLogs: Trace[] = [];

// Builds a trace object only when request matches capture policy.
const buildTrace = (req: Request, res: Response, startTime: number, traceId: string, tracePolicy: TracePolicy): Trace | undefined => {
    const durationMs = Date.now() - startTime;
    const isCode = tracePolicy.captureCodes;
    const isSlow = durationMs > tracePolicy.captureSlow;
    const isErr = isCode.includes(Math.floor(res.statusCode / 100));

    if (!isSlow && !isErr) {
        return;
    }

    return {
        id: traceId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        startTime,
        durationMs,
        ip: req.ip,
        userAgent: req.headers["user-agent"]
    };
};



// **Example with custom handler:**

// ```typescript
// import express from 'express';
// import { createTraceRequest, Trace } from './path/to/tracer'; // Adjust path as needed

// const customTraceHandler = (trace: Trace) => {
//     console.log(`[Custom Trace Handler] Request ${trace.id} took ${trace.durationMs}ms`);
//     // You could send this trace to a logging service, database, etc.
// };

// const app = express();

// // Use createTraceRequest with custom options
// app.use(createTraceRequest({
//     onTrace: customTraceHandler,
//     saveToMemory: false, // Disable in-memory logging, only use custom handler
//     maxLogs: 500         // This option has no effect if saveToMemory is false
//     policy: {                        // Polcy when to log and capture request or let it go
//       captureSlow: 200;
//       captureCodes: [4, 5];
//     }
// }));

// // ... rest of your Express app setup
// ```

export const createTraceRequest = (options: TraceRequestOptions = {}) => {
    const saveToMemory = options.saveToMemory ?? true;
    const onTrace = options.onTrace;
    const maxLogs = options.maxLogs ?? 1000;
    const tracePolicy: TracePolicy = {
        captureSlow: options.policy?.captureSlow ?? defaultPolicy.captureSlow,
        captureCodes: options.policy?.captureCodes ?? defaultPolicy.captureCodes
    };

    return (req: Request, res: Response, next: NextFunction) => {
        // Mark request start and attach a trace id for correlation.
        const startTime = Date.now();
        const traceId = randomUUID();
        req.startTime = startTime;
        res.setHeader("X-Trace-Id", traceId);

        // Capture final status and duration once response is sent.
        res.on("finish", () => {
            const trace = buildTrace(req, res, startTime, traceId, tracePolicy);
            if (!trace) {
                return;
            }

            // Store in-memory if enabled.
            if (saveToMemory) {
                traceLogs.push(trace);
                if (traceLogs.length > maxLogs) {
                    traceLogs.splice(0, traceLogs.length - maxLogs);
                }
            }

            // Forward trace to consumer callback if provided.
            if (onTrace) {
                onTrace(trace);
            }
        });

        next();
    };
};

// Returns a safe copy so callers cannot mutate internal storage directly.
export const getTraceLogs = () => [...traceLogs];
// Clears all in-memory logs.
export const clearTraceLogs = () => traceLogs.length = 0;
// ### Accessing Traces

// If `saveToMemory` is enabled, you can retrieve all logged traces and clear them:

// ```typescript
// import { getTraceLogs, clearTraceLogs } from './path/to/tracer';

// // To get all stored traces:
// const allTraces = getTraceLogs();
// console.log(allTraces);

// // To clear all stored traces:
// clearTraceLogs();
// ```



export const getDefaultTracePolicy = () => ({ ...defaultPolicy });
// # Tracing Policy

// Package users can either:
// 1. Use the package default policy, or
// 2. Create and pass their own policy per app.

// ## Default Policy
// The package ships with an internal default policy from `tracing-policy.json`.
// Get it at runtime:
// ```ts
// import { getDefaultTracePolicy } from "dts-tracer";
// const policy = getDefaultTracePolicy();
// ```

// ## Create Your Own Policy
// Define your own policy object and pass it to `createTraceRequest`.
// ```ts
// import { createTraceRequest } from "dts-tracer";
// const customPolicy = {
// 	captureSlow: 300,
// 	captureCodes: [4, 5]
// };
// app.use(createTraceRequest({ policy: customPolicy }));
// ```

// ## Fields
// - `captureSlow` (number): capture if duration is above this value in milliseconds.
// - `captureCodes` (`number[]`): capture when status class matches:
// 	- `1` => 1xx
// 	- `2` => 2xx
// 	- `3` => 3xx
// 	- `4` => 4xx
// 	- `5` => 5xx

// ## Notes
// - `policy` is optional. If omitted, package defaults are used.
// - You can still stream traces with `onTrace` and save them to your own DB/file.
