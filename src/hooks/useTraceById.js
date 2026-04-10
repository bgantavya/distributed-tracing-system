import { useState, useEffect, useCallback } from 'react';
import { getTraceById } from '../services/api';
import { cacheService } from '../services/cache';

export function useTraceById(traceId) {
  const [trace, setTrace] = useState(null);
  const [spans, setSpans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrace = useCallback(async () => {
    if (!traceId) return;

    const cacheKey = `trace_${traceId}`;
    const cached = cacheService.get(cacheKey);
    
    if (cached) {
      setTrace(cached.trace);
      setSpans(cached.spans);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getTraceById(traceId);
      const traceData = {
        ...data.trace[0],
        spans: data.trace
      };
      
      setTrace(traceData);
      setSpans(data.trace);
      cacheService.set(cacheKey, { trace: traceData, spans: data.trace }, 30000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [traceId]);

  useEffect(() => {
    fetchTrace();
  }, [fetchTrace]);

  return { trace, spans, loading, error, refresh: fetchTrace };
}
