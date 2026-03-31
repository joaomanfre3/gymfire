import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getStreakMultiplier } from '@/lib/points';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const multiplier = getStreakMultiplier(user.currentStreak);

    return NextResponse.json({
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      multiplier,
      lastWorkoutAt: user.lastWorkoutAt,
    });
  } catch (error) {
    console.error('Streak error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
