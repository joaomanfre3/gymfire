import { useEffect } from 'react';

export function useRestTimer(active: boolean, onTick: () => void) {
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(onTick, 1000);
    return () => clearInterval(interval);
  }, [active, onTick]);
}
