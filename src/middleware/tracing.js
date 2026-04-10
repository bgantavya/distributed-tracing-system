import { v4 as uuidv4 } from 'uuid';
import async_hooks from 'async_hooks';

class TraceContext {
  constructor() {
    this.store = new Map();
    this.asyncHook = async_hooks.createHook({
      init(asyncId, type, triggerAsyncId) {},
      before(asyncId) {
        const context = TraceContext.instances.get(triggerAsyncId);
        if (context) {
          TraceContext.instances.set(asyncId, context);
        }
      },
      after(asyncId) {
        TraceContext.instances.delete(asyncId);
      },
      destroy(asyncId) {
        TraceContext.instances.delete(asyncId);
      }
    });
  }

  static instances = new Map();

  static getCurrent() {
    return this.instances.get(async_hooks.executionAsyncId());
  }

  static setCurrent(context) {
    this.instances.set(async_hooks.executionAsyncId(), context);
  }
}

export const tracingMiddleware = (req, res, next) => {
  const traceId = req.headers['x-trace-id'] || uuidv4();
  const spanId = uuidv4().substring(0, 16);
  const pid = process.pid;

  const traceContext = {
    traceId,
    spanId,
    parentSpanId: req.headers['x-parent-span-id'] || null,
    serviceName: process.env.SERVICE_NAME || 'distributed-tracing-service',
    processId: pid,
    startTime: Date.now(),
    sampled: true,
    samplingReason: null
  };

  TraceContext.setCurrent(traceContext);
  req.traceContext = traceContext;

  res.setHeader('x-trace-id', traceId);
  res.setHeader('x-span-id', spanId);
  res.setHeader('x-process-id', pid.toString());

  next();
};

export { TraceContext };
