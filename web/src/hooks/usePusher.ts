'use client';

import { useEffect, useCallback } from 'react';
import { getPusherClient } from '@/lib/pusher-client';

export function usePusherChannel(
  channelName: string,
  eventName: string,
  callback: (data: unknown) => void,
  enabled = true
) {
  const stableCallback = useCallback(callback, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(channelName);
    channel.bind(eventName, stableCallback);

    return () => {
      channel.unbind(eventName, stableCallback);
      pusher.unsubscribe(channelName);
    };
  }, [channelName, eventName, stableCallback, enabled]);
}
