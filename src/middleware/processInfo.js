import os from 'os';

export function processInfoMiddleware(req, res, next) {
  req.processInfo = {
    pid: process.pid,
    ppid: process.pid,
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
