import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { getStreakMultiplier, calculateWorkoutPoints } from '@/lib/points';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const workout = await prisma.workout.findUnique({
      where: { id },
      include: {
        sets: true,
        personalRecords: true,
      },
    });

    if (!workout || workout.userId !== user.id) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    if (workout.finishedAt) {
      return NextResponse.json(
        { error: 'Workout is already finished' },
        { status: 400 }
      );
    }

    const now = new Date();
    const durationSecs = Math.round(
      (now.getTime() - workout.startedAt.getTime()) / 1000
    );

    // Calculate totals
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;

    for (const set of workout.sets) {
      if (!set.isWarmup) {
        totalSets++;
        const setReps = set.reps ?? 0;
        const setWeight = set.weight ?? 0;
        totalReps += setReps;
        totalVolume += setReps * setWeight;
      }
    }

    const prCount = workout.personalRecords.length;

    // Calculate streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastWorkoutDate = user.lastWorkoutAt
      ? new Date(user.lastWorkoutAt)
      : null;

    let newStreak = user.currentStreak;

    if (lastWorkoutDate) {
      const lastDate = new Date(lastWorkoutDate);
      lastDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        newStreak = user.currentStreak + 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
      // diffDays === 0 means same day, streak stays the same
    } else {
      newStreak = 1;
    }

    const longestStreak = Math.max(user.longestStreak, newStreak);
    const streakMultiplier = getStreakMultiplier(newStreak);
    const pointsEarned = calculateWorkoutPoints(
      totalVolume,
      prCount,
      streakMultiplier
    );

    // Update workout
    const finishedWorkout = await prisma.workout.update({
      where: { id },
      data: {
        finishedAt: now,
        durationSecs,
        totalVolume,
        totalSets,
        totalReps,
        pointsEarned,
      },
      include: {
        sets: {
          include: { exercise: true },
          orderBy: { setNumber: 'asc' },
        },
        personalRecords: true,
        routine: true,
      },
    });

    // Update user stats
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalPoints: { increment: pointsEarned },
        lastWorkoutAt: now,
        currentStreak: newStreak,
        longestStreak,
      },
    });

    // Create point transaction
    await prisma.pointTransaction.create({
      data: {
        userId: user.id,
        amount: pointsEarned,
        type: 'WORKOUT_COMPLETE',
        description: `Workout completed: ${finishedWorkout.title || 'Untitled'}`,
        refId: id,
      },
    });

    // Create streak log
    await prisma.streakLog.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
      update: {
        streakDay: newStreak,
      },
      create: {
        userId: user.id,
        date: today,
        streakDay: newStreak,
      },
    });

    return NextResponse.json(finishedWorkout);
  } catch (error) {
    console.error('Workout finish error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
