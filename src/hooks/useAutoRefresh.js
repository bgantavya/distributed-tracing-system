import { useState, useEffect, useRef } from 'react';

export function useAutoRefresh(callback, interval, enabled = true) {
  const savedCallback = useRef(callback);
  const [isActive, setIsActive] = useState(enabled);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isActive || !enabled) return;

    const tick = () => {
      savedCallback.current();
    };

    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [interval, isActive, enabled]);

  const start = () => setIsActive(true);
  const stop = () => setIsActive(false);
  const toggle = () => setIsActive(prev => !prev);

  return { isActive, start, stop, toggle };
}
