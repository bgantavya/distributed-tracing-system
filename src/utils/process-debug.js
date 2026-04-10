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
