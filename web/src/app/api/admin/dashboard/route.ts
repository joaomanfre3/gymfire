import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminUser, adminUnauthorized } from '@/lib/admin';

export async function GET(request: Request) {
  const admin = await getAdminUser(request);
  if (!admin) return adminUnauthorized();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    usersThisWeek,
    usersThisMonth,
    totalExercises,
    totalWorkouts,
    workoutsThisWeek,
    totalPosts,
    postsThisWeek,
    totalPoints,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.exercise.count(),
    prisma.workout.count({ where: { finishedAt: { not: null } } }),
    prisma.workout.count({ where: { finishedAt: { gte: weekAgo } } }),
    prisma.post.count(),
    prisma.post.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.aggregate({ _sum: { totalPoints: true } }),
    prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, username: true, displayName: true, email: true,
        role: true, isVerified: true, isPremium: true, totalPoints: true,
        currentStreak: true, createdAt: true,
        _count: { select: { workouts: true, posts: true } },
      },
    }),
  ]);

  return NextResponse.json({
    stats: {
      totalUsers,
      usersThisWeek,
      usersThisMonth,
      totalExercises,
      totalWorkouts,
      workoutsThisWeek,
      totalPosts,
      postsThisWeek,
      totalPointsDistributed: totalPoints._sum.totalPoints || 0,
    },
    recentUsers,
  });
}
