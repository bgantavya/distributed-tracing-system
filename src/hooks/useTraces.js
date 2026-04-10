import { useState, useEffect, useCallback } from 'react';
import { getTracesByService, getSlowTraces, getErrorTraces } from '../services/api';
import { useTracing } from '../context/TracingContext';

export function useTraces(serviceName) {
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { filters } = useTracing();

  const fetchTraces = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const now = new Date();
      const startDate = filters.startDate || new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const endDate = filters.endDate || now;

      const data = await getTracesByService(serviceName, startDate, endDate);
      setTraces(data.spans || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [serviceName, filters]);

  useEffect(() => {
    fetchTraces();
  }, [fetchTraces]);

  const filteredTraces = traces.filter(trace => {
    if (filters.status !== 'all' && trace.status !== filters.status) {
      return false;
    }
    if (trace.duration < filters.minDuration || trace.duration > filters.maxDuration) {
      return false;
    }
    return true;
  });

  return {
    traces: filteredTraces,
    loading,
    error,
    refresh: fetchTraces
  };
}
