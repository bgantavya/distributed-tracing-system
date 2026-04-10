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
