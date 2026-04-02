import Pusher from 'pusher';

let pusherInstance: Pusher | null = null;

export function getPusherServer(): Pusher | null {
  if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_KEY || !process.env.PUSHER_SECRET) {
    return null;
  }

  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER || 'sa1',
      useTLS: true,
    });
  }

  return pusherInstance;
}

// Channel names
export const CHANNELS = {
  FEED: 'feed',
  RANKING: 'ranking',
  WORKOUT: (userId: string) => `private-workout-${userId}`,
  USER: (userId: string) => `private-user-${userId}`,
} as const;

// Event names
export const EVENTS = {
  NEW_POST: 'new-post',
  NEW_LIKE: 'new-like',
  NEW_COMMENT: 'new-comment',
  RANKING_UPDATE: 'ranking-update',
  WORKOUT_STARTED: 'workout-started',
  WORKOUT_FINISHED: 'workout-finished',
  NEW_FOLLOWER: 'new-follower',
  NEW_PR: 'new-pr',
} as const;

// Helper to trigger events safely
export async function triggerEvent(channel: string, event: string, data: unknown) {
  const pusher = getPusherServer();
  if (!pusher) return;

  try {
    await pusher.trigger(channel, event, data);
  } catch (error) {
    console.error('Pusher trigger error:', error);
  }
}
