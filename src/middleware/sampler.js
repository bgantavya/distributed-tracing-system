import { AdaptiveSampler } from '../tracing/adaptive-sampler.js';

const sampler = new AdaptiveSampler({
  baseSampleRate: 0.1,
  slowThreshold: 1000,
  verySlowThreshold: 5000,
  fastSampleRate: 0.05,
  normalSampleRate: 0.1,
  slowSampleRate: 0.5,
  errorSampleRate: 1.0,
  verySlowSampleRate: 1.0
});

export function samplingMiddleware(req, res, next) {
  req.traceContext.samplingDecision = sampler.makeSamplingDecision({
    path: req.path,
    method: req.method,
    status: 'pending',
    duration: 0,
    forceSample: req.headers['x-trace-sampled'] === 'true'
  });

  const originalEnd = res.end;
  const startTime = Date.now();

  res.end = function(...args) {
    const duration = Date.now() - startTime;
    req.traceContext.duration = duration;
    req.traceContext.status = res.statusCode >= 400 ? 'error' : 'ok';
    req.traceContext.httpStatusCode = res.statusCode;

    const finalDecision = sampler.makeSamplingDecision(req.traceContext);
    req.traceContext.samplingDecision = finalDecision;

    res.setHeader('x-trace-sampled', finalDecision.sampled ? '1' : '0');
    res.setHeader('x-sampling-reason', finalDecision.reason);

    originalEnd.apply(res, args);
  };

  next();
}

export { sampler };
