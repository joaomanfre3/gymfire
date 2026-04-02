import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'weekly';

    if (type === 'alltime') {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          totalPoints: true,
          currentStreak: true,
          isVerified: true,
          _count: {
            select: {
              workouts: true,
              followers: true,
            },
          },
        },
        orderBy: { totalPoints: 'desc' },
        take: 100,
      });

      const ranking = users.map((u, index) => ({
        rank: index + 1,
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        totalPoints: u.totalPoints,
        currentStreak: u.currentStreak,
        isVerified: u.isVerified,
        workoutsCount: u._count.workouts,
        followersCount: u._count.followers,
      }));

      return NextResponse.json(ranking);
    }

    // Weekly ranking
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weeklyPoints = await prisma.pointTransaction.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      _sum: {
        amount: true,
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
      take: 100,
    });

    const userIds = weeklyPoints.map((wp) => wp.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        totalPoints: true,
        currentStreak: true,
        isVerified: true,
        _count: {
          select: { workouts: true },
        },
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const ranking = weeklyPoints.map((wp, index) => {
      const user = userMap.get(wp.userId);
      return {
        rank: index + 1,
        id: user?.id,
        username: user?.username,
        displayName: user?.displayName,
        avatarUrl: user?.avatarUrl,
        totalPoints: user?.totalPoints ?? 0,
        weeklyPoints: wp._sum.amount ?? 0,
        currentStreak: user?.currentStreak ?? 0,
        isVerified: user?.isVerified ?? false,
        workoutsCount: user?._count.workouts ?? 0,
      };
    });

    return NextResponse.json(ranking);
  } catch (error) {
    console.error('Ranking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
