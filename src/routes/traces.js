import express from 'express';
import TraceSpan from '../models/traceSpan.js';

const router = express.Router();

router.get('/trace/:traceId', async (req, res) => {
  try {
    const trace = await TraceSpan.find({ traceId: req.params.traceId });
    res.json({ trace });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/service/:serviceName', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const spans = await TraceSpan.find({
      serviceName: req.params.serviceName,
      startTime: { $gte: start, $lte: end }
    }).sort({ startTime: -1 }).limit(100);
    
    res.json({ spans });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/slow', async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 1000;
    const traces = await TraceSpan.find({ 
      duration: { $gt: threshold },
      status: 'ok'
    }).sort({ duration: -1 }).limit(100);
    res.json({ traces });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/errors', async (req, res) => {
  try {
    const traces = await TraceSpan.find({ 
      status: { $ne: 'ok' }
    }).sort({ startTime: -1 }).limit(100);
    res.json({ traces });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/process/:pid', async (req, res) => {
  try {
    const pid = parseInt(req.params.pid);
    const spans = await TraceSpan.find({ processId: pid });
    res.json({ processId: pid, spans });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const { serviceName, startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const query = {
      startTime: { $gte: start, $lte: end }
    };
    if (serviceName) {
      query.serviceName = serviceName;
    }
    
    const spans = await TraceSpan.find(query);
    
    if (spans.length === 0) {
      res.json({ stats: {} });
      return;
    }
    
    const durations = spans.map(s => s.duration).sort((a, b) => a - b);
    const totalTraces = spans.length;
    const avgDuration = durations.reduce((a, b) => a + b, 0) / totalTraces;
    const errorCount = spans.filter(s => s.status !== 'ok').length;
    const p50 = durations[Math.floor(totalTraces * 0.5)] || 0;
    const p95 = durations[Math.floor(totalTraces * 0.95)] || 0;
    const p99 = durations[Math.floor(totalTraces * 0.99)] || 0;
    
    res.json({ 
      stats: {
        totalTraces,
        avgDuration,
        maxDuration: Math.max(...durations),
        minDuration: Math.min(...durations),
        errorCount,
        p50Duration: p50,
        p95Duration: p95,
        p99Duration: p99
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/test/delay', async (req, res) => {
  const { seconds } = req.body;
  const delayMs = (seconds || 1) * 1000;
  const traceId = req.traceContext?.traceId || `trace-${Date.now()}`;
  const spanId = `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + delayMs);
  
  setTimeout(async () => {
    const trace = new TraceSpan({
      traceId,
      spanId,
      parentSpanId: null,
      serviceName: process.env.SERVICE_NAME || 'distributed-tracing-service',
      processId: process.pid,
      operationName: 'test.delay',
      startTime,
      endTime,
      duration: delayMs,
      tags: [{ key: 'test.type', value: 'delay' }, { key: 'delay.seconds', value: seconds }],
      logs: [],
      status: 'ok',
      samplingDecision: true,
      samplingReason: 'slow'
    });
    await trace.save();
    
    res.json({
      message: `Delayed for ${seconds} seconds`,
      traceId,
      spanId,
      duration: delayMs
    });
  }, delayMs);
});

router.post('/test/status', async (req, res) => {
  const { statusCode = 200 } = req.body;
  const traceId = req.traceContext?.traceId || `trace-${Date.now()}`;
  const spanId = `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const status = statusCode >= 400 ? 'error' : 'ok';
  
  const trace = new TraceSpan({
    traceId,
    spanId,
    parentSpanId: null,
    serviceName: process.env.SERVICE_NAME || 'distributed-tracing-service',
    processId: process.pid,
    operationName: 'test.status',
    startTime: new Date(),
    endTime: new Date(),
    duration: 1,
    tags: [{ key: 'test.type', value: 'status' }, { key: 'status.code', value: statusCode }],
    logs: [],
    status,
    httpStatusCode: statusCode,
    samplingDecision: true,
    samplingReason: status === 'error' ? 'error' : 'fast'
  });
  await trace.save();
  
  res.status(statusCode).json({
    message: `Status code: ${statusCode}`,
    traceId,
    spanId
  });
});

router.post('/test/proxy', async (req, res) => {
  const { url } = req.body;
  const traceId = req.traceContext?.traceId || `trace-${Date.now()}`;
  const spanId = `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = new Date();
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required', traceId });
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    const data = await response.text();
    const endTime = new Date();
    
    const trace = new TraceSpan({
      traceId,
      spanId,
      parentSpanId: null,
      serviceName: process.env.SERVICE_NAME || 'distributed-tracing-service',
      processId: process.pid,
      operationName: 'test.proxy',
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      tags: [{ key: 'test.type', value: 'proxy' }, { key: 'proxy.url', value: url }, { key: 'proxy.status', value: response.status }],
      logs: [],
      status: response.ok ? 'ok' : 'error',
      httpStatusCode: response.status,
      samplingDecision: true,
      samplingReason: 'fast'
    });
    await trace.save();
    
    res.json({
      message: 'Proxy test completed',
      proxyStatus: response.status,
      proxyOk: response.ok,
      traceId,
      data: data.substring(0, 200)
    });
  } catch (error) {
    const endTime = new Date();
    let errorMessage = error.message;
    let errorType = 'network';
    
    if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
      errorMessage = `Cannot connect to ${url}. The site may be blocking server requests or is not accessible.`;
      errorType = 'blocked';
    } else if (error.message.includes('CORS')) {
      errorMessage = `CORS error - the server doesn't allow cross-origin requests from this application.`;
      errorType = 'cors';
    }
    
    const trace = new TraceSpan({
      traceId,
      spanId,
      parentSpanId: null,
      serviceName: process.env.SERVICE_NAME || 'distributed-tracing-service',
      processId: process.pid,
      operationName: 'test.proxy',
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      tags: [{ key: 'test.type', value: 'proxy' }, { key: 'proxy.url', value: url }, { key: 'error.type', value: errorType }],
      logs: [],
      status: 'error',
      errorMessage,
      samplingDecision: true,
      samplingReason: 'error'
    });
    await trace.save();
    
    res.status(500).json({
      error: errorMessage,
      errorType,
      traceId
    });
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

export default router;
