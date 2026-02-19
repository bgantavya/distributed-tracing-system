import { DeployT } from "../utils/constant.js";
import { Trace } from "../utils/types.js";

const traces: Trace[] = [];

export const getTraces = () => [...traces];
// export const clearTraces = () => traces.length = 0;
export const addTrace = (trace: Trace) => {
    if (process.env.NODE_ENV !== DeployT.Dev) {
        console.log(trace);
    }
    traces.push(trace);
};

