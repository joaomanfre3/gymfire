import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);

    const { searchParams } = new URL(request.url);
    const skip = Math.max(0, parseInt(searchParams.get('skip') || '0', 10));
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20', 10)), 50);

    let whereClause: Prisma.PostWhereInput;

    if (user) {
      const following = await prisma.follow.findMany({
        where: { followerId: user.id },
        select: { followingId: true },
      });

      const followingIds = following.map((f) => f.followingId);
      const feedUserIds = [user.id, ...followingIds];

      whereClause = {
        AND: [
          { userId: { in: feedUserIds } },
          {
            OR: [
              { visibility: 'PUBLIC' },
              { visibility: 'FOLLOWERS' },
              { userId: user.id },
            ],
          },
        ],
      };
    } else {
      whereClause = { visibility: 'PUBLIC' };
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        workout: {
          select: {
            id: true,
            title: true,
            totalVolume: true,
            totalSets: true,
            totalReps: true,
            durationSecs: true,
            sets: {
              select: { exercise: { select: { name: true } } },
              distinct: ['exerciseId'],
              take: 10,
            },
          },
        },
        likes: user ? {
          where: { userId: user.id },
          select: { id: true },
          take: 1,
        } : false,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const result = posts.map(post => ({
      ...post,
      isLiked: user ? (post.likes && Array.isArray(post.likes) && post.likes.length > 0) : false,
      likes: undefined,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Feed error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
