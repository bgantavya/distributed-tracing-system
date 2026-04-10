<<<<<<< HEAD
# Distributed Tracing System - Backend Documentation

## Overview

This document describes the backend architecture of the Distributed Tracing System, focusing on Express middleware, trace context propagation, MongoDB storage, adaptive sampling, and integration with Unix process IDs.

## Architecture Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Backend Architecture                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                 │
│  │   Client     │────▶│   Express    │────▶│   Trace      │                 │
│  │   Request    │     │   Middleware │     │   Context    │                 │
│  └──────────────┘     └──────────────┘     └──────────────┘                 │
│                              │                       │                         │
│                              │                       ▼                         │
│                              │              ┌──────────────┐                 │
│                              │              │  Adaptive    │                 │
│                              │              │  Sampler     │                 │
│                              │              └──────────────┘                 │
│                              │                       │                         │
│                              ▼                       ▼                         │
│                       ┌──────────────────────────────────┐                   │
│                       │         MongoDB                  │                   │
│                       │  ┌────────────────────────────┐  │                   │
│                       │  │  spans collection          │  │                   │
│                       │  │  ├─ traceId (unique)       │  │                   │
│                       │  │  ├─ spanId                 │  │                   │
│                       │  │  ├─ parentSpanId           │  │                   │
│                       │  │  ├─ serviceName            │  │                   │
│                       │  │  ├─ processId              │  │                   │
│                       │  │  ├─ operationName          │  │                   │
│                       │  │  ├─ startTime              │  │                   │
│                       │  │  ├─ endTime                │  │                   │
│                       │  │  ├─ duration (ms)         │  │                   │
│                       │  │  ├─ tags (key-value)       │  │                   │
│                       │  │  ├─ logs (timestamp,msg)   │  │                   │
│                       │  │  ├─ status (ok|error)      │  │                   │
│                       │  │  ├─ samplingDecision       │  │                   │
│                       │  │  └─ samplingReason         │  │                   │
│                       │  └────────────────────────────┘  │                   │
│                       └──────────────────────────────────┘                   │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 1. Express Middleware - Trace ID Injection

### 1.1 Middleware Implementation

```javascript
// src/middleware/tracing.js

const { v4: uuidv4 } = require('uuid');
const async_hooks = require('async_hooks');

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

const tracingMiddleware = (req, res, next) => {
  const traceId = req.headers['x-trace-id'] || uuidv4();
  const spanId = uuidv4().substring(0, 16);
  const pid = process.pid;

  const traceContext = {
    traceId,
    spanId,
    parentSpanId: req.headers['x-parent-span-id'] || null,
    serviceName: process.env.SERVICE_NAME || 'unknown-service',
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

module.exports = { tracingMiddleware, TraceContext };
```

### 1.2 Usage in Express App

```javascript
// server.js

const express = require('express');
const { tracingMiddleware } = require('./src/middleware/tracing');
const traceRoutes = require('./src/routes/traces');

const app = express();

app.use(tracingMiddleware);
app.use('/api/traces', traceRoutes);

app.listen(3000, () => {
  console.log(`Server running on PID: ${process.pid}`);
});
```

## 2. Trace Context Propagation Across Async Boundaries

### 2.1 Async Hooks for Context Propagation

```javascript
// src/tracing/async-context.js

const async_hooks = require('async_hooks');

class AsyncLocalStorage {
  constructor() {
    this.store = new Map();
    this.asyncHook = async_hooks.createHook({
      init(asyncId, type, triggerAsyncId) {
        const parentContext = AsyncLocalStorage.store.get(triggerAsyncId);
        if (parentContext) {
          AsyncLocalStorage.store.set(asyncId, parentContext);
        }
      },
      before(asyncId) {
        const context = AsyncLocalStorage.store.get(asyncId);
        if (context) {
          AsyncLocalStorage.currentContext = context;
        }
      },
      after(asyncId) {
        AsyncLocalStorage.currentContext = null;
      },
      destroy(asyncId) {
        AsyncLocalStorage.store.delete(asyncId);
      }
    });
  }

  static store = new Map();
  static currentContext = null;

  get() {
    return AsyncLocalStorage.currentContext;
  }

  run(store, fn, ...args) {
    const asyncId = async_hooks.executionAsyncId();
    AsyncLocalStorage.store.set(asyncId, store);
    try {
      return fn(...args);
    } finally {
      AsyncLocalStorage.store.delete(asyncId);
    }
  }

  getStore() {
    return AsyncLocalStorage.currentContext;
  }
}

module.exports = { AsyncLocalStorage };
```

### 2.2 Wrapper for Async Operations

```javascript
// src/tracing/wrap-async.js

const { AsyncLocalStorage } = require('./async-context');

function wrapAsync(fn) {
  return function(...args) {
    const context = AsyncLocalStorage.getStore();
    return AsyncLocalStorage.run(context, () => fn.apply(this, args));
  };
}

function withTraceContext(context, fn) {
  return AsyncLocalStorage.run(context, fn);
}

module.exports = { wrapAsync, withTraceContext };
```

### 2.3 Example: Database Query with Trace Context

```javascript
// src/services/userService.js

const { withTraceContext } = require('../tracing/wrap-async');
const mongodb = require('./mongodb');

async function findUserById(userId) {
  return withTraceContext(AsyncLocalStorage.getStore(), async () => {
    const db = await mongodb.getDb();
    const span = createSpan('mongodb.findUserById');
    
    try {
      const user = await db.collection('users').findOne({ _id: userId });
      span.status = 'ok';
      return user;
    } catch (error) {
      span.status = 'error';
      span.error = error.message;
      throw error;
    } finally {
      span.end();
    }
  });
}
```

## 3. MongoDB Storage for Trace Spans

### 3.1 Database Schema

```javascript
// src/models/traceSpan.js

const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  key: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { _id: false });

const logSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  message: { type: String },
  fields: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { _id: false });

const spanSchema = new mongoose.Schema({
  traceId: {
    type: String,
    required: true,
    index: true
  },
  spanId: {
    type: String,
    required: true,
    unique: true
  },
  parentSpanId: {
    type: String,
    default: null,
    index: true
  },
  serviceName: {
    type: String,
    required: true,
    index: true
  },
  processId: {
    type: Number,
    required: true,
    index: true
  },
  operationName: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    index: true
  },
  tags: [tagSchema],
  logs: [logSchema],
  status: {
    type: String,
    enum: ['ok', 'error', 'client_error', 'server_error'],
    default: 'ok',
    index: true
  },
  httpStatusCode: {
    type: Number,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  },
  samplingDecision: {
    type: Boolean,
    default: true
  },
  samplingReason: {
    type: String,
    enum: ['always', 'error', 'slow', 'sampled', 'dropped'],
    default: 'sampled'
  },
  resource: {
    type: String,
    default: null
  },
  serviceVersion: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  collection: 'spans'
});

spanSchema.index({ traceId: 1, startTime: -1 });
spanSchema.index({ serviceName: 1, status: 1, startTime: -1 });
spanSchema.index({ 'tags.key': 1, 'tags.value': 1 });

module.exports = mongoose.model('TraceSpan', spanSchema);
```

### 3.2 Span Repository

```javascript
// src/repositories/spanRepository.js

const TraceSpan = require('../models/traceSpan');

class SpanRepository {
  async saveSpan(span) {
    const traceSpan = new TraceSpan(span);
    return await traceSpan.save();
  }

  async saveSpans(spans) {
    return await TraceSpan.insertMany(spans, { ordered: false });
  }

  async getTraceById(traceId) {
    return await TraceSpan.find({ traceId })
      .sort({ startTime: 1 })
      .lean();
  }

  async getTracesByService(serviceName, startDate, endDate) {
    return await TraceSpan.find({
      serviceName,
      startTime: { $gte: startDate, $lte: endDate }
    })
      .sort({ startTime: -1 })
      .limit(1000)
      .lean();
  }

  async getSlowTraces(thresholdMs = 1000, limit = 100) {
    return await TraceSpan.find({
      duration: { $gt: thresholdMs },
      status: 'ok'
    })
      .sort({ duration: -1 })
      .limit(limit)
      .lean();
  }

  async getErrorTraces(limit = 100) {
    return await TraceSpan.find({
      status: { $in: ['error', 'client_error', 'server_error'] }
    })
      .sort({ startTime: -1 })
      .limit(limit)
      .lean();
  }

  async getTracesByProcessId(processId) {
    return await TraceSpan.find({ processId })
      .sort({ startTime: -1 })
      .lean();
  }

  async getAggregatedStats(serviceName, startDate, endDate) {
    return await TraceSpan.aggregate([
      {
        $match: {
          serviceName,
          startTime: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalTraces: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          maxDuration: { $max: '$duration' },
          minDuration: { $min: '$duration' },
          errorCount: {
            $sum: { $cond: [{ $ne: ['$status', 'ok'] }, 1, 0] }
          },
          p50Duration: { $percentile: { p: 0.5, input: '$duration' } },
          p95Duration: { $percentile: { p: 0.95, input: '$duration' } },
          p99Duration: { $percentile: { p: 0.99, input: '$duration' } }
        }
      }
    ]);
  }

  async cleanupOldTraces(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    return await TraceSpan.deleteMany({
      startTime: { $lt: cutoffDate }
    });
  }
}

module.exports = new SpanRepository();
```

## 4. Adaptive Sampling

### 4.1 Sampling Strategy

```javascript
// src/tracing/adaptive-sampler.js

const { AsyncLocalStorage } = require('./async-context');

class AdaptiveSampler {
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

module.exports = { AdaptiveSampler };
```

### 4.2 Sampler Middleware

```javascript
// src/middleware/sampler.js

const { AdaptiveSampler } = require('../tracing/adaptive-sampler');

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

function samplingMiddleware(req, res, next) {
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

module.exports = { samplingMiddleware, sampler };
```

## 5. Unix Process ID Integration

### 5.1 Process ID Middleware

```javascript
// src/middleware/processInfo.js

const os = require('os');

function processInfoMiddleware(req, res, next) {
  req.processInfo = {
    pid: process.pid,
    ppid: process.ppid,
    hostname: os.hostname(),
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    uptime: process.uptime(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      SERVICE_NAME: process.env.SERVICE_NAME,
      SERVICE_VERSION: process.env.SERVICE_VERSION
    }
  };

  res.setHeader('x-process-id', process.pid.toString());
  res.setHeader('x-hostname', os.hostname());

  next();
}

module.exports = { processInfoMiddleware };
```

### 5.2 Process ID Debugging Utilities

```javascript
// src/utils/process-debug.js

const fs = require('fs');
const { execSync } = require('child_process');

function getProcessInfo(pid) {
  try {
    const stats = fs.statSync(`/proc/${pid}`);
    return {
      pid,
      started: stats.birthtime,
      cpuTime: getCpuTime(pid),
      memory: getMemoryUsage(pid),
      threads: getThreadCount(pid)
    };
  } catch (error) {
    return { pid, error: 'Process not found or not accessible' };
  }
}

function getCpuTime(pid) {
  try {
    const cpuTime = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
    const times = cpuTime.split(' ').slice(13, 17).map(Number);
    return {
      user: times[0] / 100,
      system: times[1] / 100
    };
  } catch {
    return null;
  }
}

function getMemoryUsage(pid) {
  try {
    const status = fs.readFileSync(`/proc/${pid}/status`, 'utf8');
    const rssMatch = status.match(/VmRSS:\s+(\d+)\s+kB/);
    return rssMatch ? parseInt(rssMatch[1]) * 1024 : null;
  } catch {
    return null;
  }
}

function getThreadCount(pid) {
  try {
    const threads = fs.readdirSync(`/proc/${pid}/task`);
    return threads.length;
  } catch {
    return null;
  }
}

function killProcess(pid, signal = 'SIGTERM') {
  try {
    process.kill(pid, signal);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  getProcessInfo,
  getCpuTime,
  getMemoryUsage,
  getThreadCount,
  killProcess
};
```

## 6. Trace Span Lifecycle

### 6.1 Span Manager

```javascript
// src/tracing/span-manager.js

const { AsyncLocalStorage } = require('./async-context');
const spanRepository = require('../repositories/spanRepository');
const { sampler } = require('../middleware/sampler');

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

    if (samplingDecision.sampled) {
      try {
        await spanRepository.saveSpan(span);
      } catch (error) {
        console.error('Failed to save span:', error);
      }
    }

    return span;
  }

  async endAllSpans() {
    const spans = Array.from(this.activeSpans.values());
    for (const span of spans) {
      await this.endSpan(span.spanId);
    }
  }
}

module.exports = new SpanManager();
```

## 7. Error Tracking

### 7.1 Error Handler Middleware

```javascript
// src/middleware/errorHandler.js

const spanManager = require('../tracing/span-manager');

function errorHandler(err, req, res, next) {
  const traceContext = req.traceContext;
  const spanId = traceContext?.spanId;

  if (spanId) {
    spanManager.addLog(spanId, 'Error occurred', {
      error: err.message,
      stack: err.stack,
      code: err.code,
      statusCode: err.statusCode
    });

    spanManager.setStatus(spanId, 'error', err.message);

    spanManager.addTag(spanId, 'error', true);
    spanManager.addTag(spanId, 'error.type', err.name || 'Error');
    spanManager.addTag(spanId, 'error.message', err.message);
    spanManager.addTag(spanId, 'error.stack', err.stack);

    spanManager.endSpan(spanId, { status: 'error' });
  }

  const statusCode = err.statusCode || 500;
  const errorResponse = {
    error: {
      message: err.message,
      code: err.code,
      traceId: traceContext?.traceId,
      spanId
    }
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}

module.exports = { errorHandler };
```

## 8. API Endpoints

### 8.1 Trace Routes

```javascript
// src/routes/traces.js

const express = require('express');
const router = express.Router();
const spanRepository = require('../repositories/spanRepository');
const spanManager = require('../tracing/span-manager');
const { getProcessInfo } = require('../utils/process-debug');

router.get('/trace/:traceId', async (req, res) => {
  try {
    const trace = await spanRepository.getTraceById(req.params.traceId);
    res.json({ trace });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/service/:serviceName', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const spans = await spanRepository.getTracesByService(
      req.params.serviceName,
      new Date(startDate),
      new Date(endDate)
    );
    res.json({ spans });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/slow', async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 1000;
    const traces = await spanRepository.getSlowTraces(threshold);
    res.json({ traces });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/errors', async (req, res) => {
  try {
    const traces = await spanRepository.getErrorTraces();
    res.json({ traces });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/process/:pid', async (req, res) => {
  try {
    const pid = parseInt(req.params.pid);
    const processInfo = getProcessInfo(pid);
    const spans = await spanRepository.getTracesByProcessId(pid);
    res.json({ processInfo, spans });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const { serviceName, startDate, endDate } = req.query;
    const stats = await spanRepository.getAggregatedStats(
      serviceName,
      new Date(startDate),
      new Date(endDate)
    );
    res.json({ stats: stats[0] || {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    pid: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

module.exports = router;
```

## 9. Server Setup

### 9.1 Main Server File

```javascript
// server.js

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const { tracingMiddleware } = require('./src/middleware/tracing');
const { samplingMiddleware } = require('./src/middleware/sampler');
const { processInfoMiddleware } = require('./src/middleware/processInfo');
const { errorHandler } = require('./src/middleware/errorHandler');
const traceRoutes = require('./src/routes/traces');

const app = express();

app.use(express.json());
app.use(tracingMiddleware);
app.use(processInfoMiddleware);
app.use(samplingMiddleware);

app.use('/api/traces', traceRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', pid: process.pid });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tracing';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`Connected to MongoDB on PID: ${process.pid}`);
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await spanManager.endAllSpans();
  mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
```

## 10. Environment Variables

```bash
# .env.example

NODE_ENV=development
PORT=3000
SERVICE_NAME=distributed-tracing-service
SERVICE_VERSION=1.0.0

MONGO_URI=mongodb://localhost:27017/tracing
MONGO_USER=
MONGO_PASSWORD=

ADAPTIVE_SAMPLING=true
BASE_SAMPLE_RATE=0.1
SLOW_THRESHOLD=1000
VERY_SLOW_THRESHOLD=5000
FAST_SAMPLE_RATE=0.05
NORMAL_SAMPLE_RATE=0.1
SLOW_SAMPLE_RATE=0.5
ERROR_SAMPLE_RATE=1.0

TRACE_RETENTION_DAYS=30
```

## 11. Testing

### 11.1 Test Helper

```javascript
// __tests__/helpers/tracing.js

const { tracingMiddleware } = require('../../src/middleware/tracing');
const { samplingMiddleware } = require('../../src/middleware/sampler');

function createMockRequest(overrides = {}) {
  return {
    headers: {},
    path: '/test',
    method: 'GET',
    query: {},
    params: {},
    body: {},
    ...overrides
  };
}

function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    setHeader: jest.fn((key, value) => {
      res.headers[key] = value;
    }),
    end: jest.fn()
  };
  return res;
}

async function simulateRequest(app, method, path, options = {}) {
  const req = createMockRequest(options);
  const res = createMockResponse();
  const next = jest.fn();

  await app._router.handle(req, res, next);

  return { req, res, next };
}

module.exports = {
  createMockRequest,
  createMockResponse,
  simulateRequest
};
```

## 12. Performance Considerations

### 12.1 Recommendations

1. **Async Local Storage**: Use AsyncLocalStorage for zero-overhead context propagation
2. **Batch Processing**: Buffer spans in memory and batch write to MongoDB
3. **Indexing**: Create indexes on frequently queried fields (traceId, serviceName, startTime)
4. **Sampling**: Always sample errors and slow requests, sample fast requests at lower rate
5. **Connection Pooling**: Configure MongoDB connection pool size based on load
6. **TTL Indexes**: Use MongoDB TTL indexes for automatic data cleanup

## 13. Future Enhancements

1. **Distributed Context Propagation**: Add support for W3C Trace Context headers
2. **Real-time Streaming**: Implement WebSocket for live trace updates
3. **Machine Learning**: Predict slow requests using ML models
4. **Multi-tenancy**: Add support for isolated trace data per tenant
5. **Correlation Analysis**: Auto-detect relationships between traces
=======
# Distributed Tracing System - Backend Flow

## Overview
Backend handles authentication, serves trace data, and provides APIs for the frontend.

## Architecture

```
Browser Request
      ↓
Express Server (Port 3000)
      ↓
Middleware Layers
      ↓
Route Handlers
      ↓
MongoDB Atlas
      ↓
Response to Client
```

## Middleware Stack

1. **CORS** - Allows cross-origin requests from frontend
2. **Express JSON** - Parses JSON request bodies
3. **Express Session** - Manages sessions for Google OAuth
4. **Passport.js** - Handles Google OAuth authentication
5. **Custom Middlewares**:
   - Tracing middleware - Adds trace headers
   - Process info middleware - Adds process metadata
   - Sampling middleware - Samples requests

## API Routes

### Authentication Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/auth/register | POST | Register new user with email/password |
| /api/auth/login | POST | Login with email/password |
| /api/auth/google | GET | Initiate Google OAuth |
| /api/auth/google/callback | GET | Google OAuth callback |
| /api/auth/me | GET | Get current user |

### Traces Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/traces/service/:name | GET | Get traces by service |
| /api/traces/trace/:id | GET | Get single trace |
| /api/traces/stats | GET | Get trace statistics |
| /api/traces/slow | GET | Get slow traces |
| /api/traces/errors | GET | Get error traces |

## Authentication Flow

### Register Flow
```
1. User submits {name, email, password}
2. Server checks if email exists
3. Hash password with bcrypt (10 rounds)
4. Save user to MongoDB users collection
5. Generate JWT token (valid for 7 days)
6. Return {token, user}
```

### Login Flow (Email/Password)
```
1. User submits {email, password}
2. Server finds user by email
3. Compare password with bcrypt
4. Generate JWT token
5. Return {token, user}
```

### Google OAuth Flow
```
1. User clicks "Continue with Google"
2. Frontend redirects to /api/auth/google
3. Server redirects to Google login page
4. User logs in with Google
5. Google calls back to /api/auth/google/callback
6. Passport.js gets Google profile
7. Server finds or creates user in MongoDB
8. Generate JWT token
9. Redirect to frontend with token
```

### Protected Routes
```
1. Request comes with Authorization header
2. Server verifies JWT token
3. Extract userId from token
4. Allow or deny request
```

## Database (MongoDB Atlas)

### Users Collection
- email (unique)
- password (hashed)
- name
- googleId (for Google users)
- avatar
- createdAt

### Spans Collection (Trace Data)
- traceId
- spanId
- serviceName
- operationName
- duration
- status
- And more trace data fields

## Environment Variables
- MONGODB_URI - Atlas connection string
- JWT_SECRET - Secret for JWT signing
- GOOGLE_CLIENT_ID - Google OAuth ID
- GOOGLE_CLIENT_SECRET - Google OAuth secret
- GOOGLE_CALLBACK_URL - OAuth redirect URI
- PORT - Server port (3000)

## Summary

1. **Request** → Express processes through middleware
2. **Auth** → Validate credentials or OAuth
3. **Database** → MongoDB queries via Mongoose
4. **Response** → JSON data returned to frontend
5. **Token** → JWT for protected route security
>>>>>>> fa9b19fe (Added my project code)
