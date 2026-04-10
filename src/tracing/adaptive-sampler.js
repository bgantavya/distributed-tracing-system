export class AdaptiveSampler {
  constructor(options = {}) {
    this.baseSampleRate = options.baseSampleRate || 0.1;
    this.slowThreshold = options.slowThreshold || 1000;
    this.verySlowThreshold = options.verySlowThreshold || 5000;
    
    this.rates = {
      fast: options.fastSampleRate || 0.05,
      normal: options.normalSampleRate || 0.1,
      slow: options.slowSampleRate || 0.5,
      error: options.errorSampleRate || 1.0,
      verySlow: options.verySlowSampleRate || 1.0
    };
  }

  shouldSample(context) {
    const decision = {
      sampled: false,
      reason: null,
      sampleRate: 0
    };

    if (context.forceSample) {
      decision.sampled = true;
      decision.reason = 'forced';
      decision.sampleRate = 1.0;
      return decision;
    }

    if (context.status === 'error') {
      decision.sampled = Math.random() < this.rates.error;
      decision.reason = decision.sampled ? 'error' : 'error_dropped';
      decision.sampleRate = this.rates.error;
      return decision;
    }

    if (context.duration >= this.verySlowThreshold) {
      decision.sampled = true;
      decision.reason = 'very_slow';
      decision.sampleRate = 1.0;
      return decision;
    }

    if (context.duration >= this.slowThreshold) {
      decision.sampled = Math.random() < this.rates.slow;
      decision.reason = decision.sampled ? 'slow' : 'slow_dropped';
      decision.sampleRate = this.rates.slow;
      return decision;
    }

    decision.sampled = Math.random() < this.rates.fast;
    decision.reason = decision.sampled ? 'fast' : 'fast_dropped';
    decision.sampleRate = this.rates.fast;
    
    return decision;
  }

  makeSamplingDecision(context) {
    return this.shouldSample(context);
  }
}
