import { ServeTypes } from "../utils/constant";
import type { Trace } from "../utils/types";

const traces: Trace[] = [];

export const getTraces = () => [...traces];
export const clearTraces = () => traces.length = 0;
export const addTrace = (trace: Trace) => {
    if (process.env.NODE_ENV !== ServeTypes.Dev) {
        console.log(trace);
    }
    traces.push(trace);
};

