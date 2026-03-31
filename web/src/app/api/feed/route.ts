import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get('skip') || '0', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    // Get IDs of users the current user follows
    const following = await prisma.follow.findMany({
      where: { followerId: user.id },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    const feedUserIds = [user.id, ...followingIds];

    const posts = await prisma.post.findMany({
      where: {
        userId: { in: feedUserIds },
        OR: [
          { visibility: 'PUBLIC' },
          { visibility: 'FOLLOWERS' },
          { userId: user.id },
        ],
      },
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
          include: {
            sets: {
              include: { exercise: true },
              orderBy: { setNumber: 'asc' },
            },
          },
        },
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

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Feed error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
