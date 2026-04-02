import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        coverUrl: true,
        isVerified: true,
        isPremium: true,
        totalPoints: true,
        currentStreak: true,
        longestStreak: true,
        lastWorkoutAt: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            workouts: true,
            posts: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get recent workouts for history
    const recentWorkouts = await prisma.workout.findMany({
      where: { userId: user.id, finishedAt: { not: null } },
      orderBy: { startedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        startedAt: true,
        durationSecs: true,
        totalVolume: true,
        totalSets: true,
        totalReps: true,
        sets: {
          select: {
            exercise: { select: { name: true } },
          },
          distinct: ['exerciseId'],
          take: 5,
        },
      },
    });

    // Get personal records
    const personalRecords = await prisma.personalRecord.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        value: true,
        type: true,
        previousValue: true,
        createdAt: true,
        exercise: { select: { name: true } },
      },
    });

    return NextResponse.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      coverUrl: user.coverUrl,
      isVerified: user.isVerified,
      isPremium: user.isPremium,
      totalPoints: user.totalPoints,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastWorkoutAt: user.lastWorkoutAt,
      createdAt: user.createdAt,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      workoutsCount: user._count.workouts,
      postsCount: user._count.posts,
      recentWorkouts: recentWorkouts.map(w => ({
        id: w.id,
        title: w.title,
        date: w.startedAt,
        durationSecs: w.durationSecs,
        totalVolume: w.totalVolume,
        totalSets: w.totalSets,
        totalReps: w.totalReps,
        exercises: [...new Set(w.sets.map(s => s.exercise.name))],
      })),
      personalRecords: personalRecords.map(pr => ({
        id: pr.id,
        exercise: pr.exercise.name,
        value: pr.value,
        previousValue: pr.previousValue,
        type: pr.type,
        date: pr.createdAt,
      })),
    });
  } catch (error) {
    console.error('User profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
