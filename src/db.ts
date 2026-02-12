import type { Trace } from "../utils/types";

const traces: Trace[] = [];

export const getTraces = () => [...traces];
export const clearTraces = () => traces.length = 0;
export const addTrace = (trace: Trace) => {
    console.log(trace);
    traces.push(trace);
};

