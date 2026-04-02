import { useCallback, useRef } from 'react';

export function useDoubleTap(callback: () => void, delay = 300) {
  const lastTap = useRef(0);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < delay) {
      callback();
    }
    lastTap.current = now;
  }, [callback, delay]);

  return handleTap;
}
