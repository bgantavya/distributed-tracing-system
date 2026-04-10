import { AsyncLocalStorage } from './async-context.js';
import { sampler } from '../middleware/sampler.js';

class SpanManager {
  constructor() {
    this.activeSpans = new Map();
  }

  createSpan(operationName, parentContext = null) {
    const context = parentContext || AsyncLocalStorage.getStore();
    if (!context) {
      throw new Error('No trace context available');
    }

    const span = {
      traceId: context.traceId,
      spanId: this.generateSpanId(),
      parentSpanId: context.spanId || null,
      serviceName: context.serviceName,
      processId: context.processId,
      operationName,
      startTime: new Date(),
      endTime: null,
      duration: null,
      tags: [],
      logs: [],
      status: 'ok',
      samplingDecision: context.samplingDecision,
      samplingReason: context.samplingDecision?.reason
    };

    this.activeSpans.set(span.spanId, span);
    return span;
  }

  generateSpanId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
  }

  addTag(spanId, key, value) {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.tags.push({ key, value, timestamp: new Date() });
    }
  }

  addLog(spanId, message, fields = {}) {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.logs.push({ message, fields, timestamp: new Date() });
    }
  }

  setStatus(spanId, status, errorMessage = null) {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.status = status;
      span.errorMessage = errorMessage;
    }
  }

  async endSpan(spanId, options = {}) {
    const span = this.activeSpans.get(spanId);
    if (!span) return null;

    span.endTime = new Date();
    span.duration = span.endTime - span.startTime;

    if (options.tags) {
      span.tags.push(...options.tags);
    }

    if (options.status) {
      span.status = options.status;
    }

    const samplingDecision = sampler.makeSamplingDecision({
      duration: span.duration,
      status: span.status
    });

    span.samplingDecision = samplingDecision.sampled;
    span.samplingReason = samplingDecision.reason;

    this.activeSpans.delete(spanId);

    return span;
  }

  async endAllSpans() {
    const spans = Array.from(this.activeSpans.values());
    for (const span of spans) {
      await this.endSpan(span.spanId);
    }
  }
}

const spanManager = new SpanManager();
export default spanManager;
