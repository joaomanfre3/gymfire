import { useState, useEffect, useCallback } from 'react';

export function useWorkoutTimer(startTime: number | null) {
  const [elapsed, setElapsed] = useState(0);

  const calcElapsed = useCallback(() => {
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime) / 1000);
  }, [startTime]);

  useEffect(() => {
    if (!startTime) { setElapsed(0); return; }

    setElapsed(calcElapsed());
    const interval = setInterval(() => {
      setElapsed(calcElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, calcElapsed]);

  return elapsed;
}
