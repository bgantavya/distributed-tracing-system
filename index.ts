// Public package exports.
// Consumers should import from "dts-tracer" (package root), not from internal paths.
export {
    // Factory that returns Express middleware for request tracing.
    createTraceRequest,
    // Returns a copy of in-memory captured traces.
    getTraceLogs,
    // Clears in-memory captured traces.
    clearTraceLogs,
    // Returns the package default policy values.
    getDefaultTracePolicy
} from "./src/tracer.js";

export type {
    // Shape of one captured trace log record.
    Trace,
    // Policy fields controlling when to capture a trace.
    TracePolicy,
    // Callback signature invoked for each captured trace.
    TraceHandler,
    // Options accepted by createTraceRequest().
    TraceRequestOptions
} from "./src/tracer.js";
