import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET - export database summary (admin only)
export async function GET(request: Request) {
  try {
    const admin = await getAuthUser(request);
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const [users, exercises, workouts, posts, conversations] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true, username: true, displayName: true, email: true, role: true,
          isVerified: true, totalPoints: true, currentStreak: true, createdAt: true,
          _count: { select: { workouts: true, posts: true, followers: true, following: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.exercise.count(),
      prisma.workout.count(),
      prisma.post.count(),
      prisma.conversation.count(),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      stats: {
        totalUsers: users.length,
        totalExercises: exercises,
        totalWorkouts: workouts,
        totalPosts: posts,
        totalConversations: conversations,
      },
      users: users.map(u => ({
        ...u,
        workoutsCount: u._count.workouts,
        postsCount: u._count.posts,
        followersCount: u._count.followers,
        followingCount: u._count.following,
        _count: undefined,
      })),
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('DB export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
