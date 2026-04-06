import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const authPayload = getAuthPayload(request);

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const following = await prisma.follow.findMany({
      where: { followerId: user.id },
      include: {
        following: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let myFollowingIds: Set<string> = new Set();
    if (authPayload) {
      const myFollows = await prisma.follow.findMany({
        where: { followerId: authPayload.userId },
        select: { followingId: true },
      });
      myFollowingIds = new Set(myFollows.map(f => f.followingId));
    }

    const result = following.map(f => ({
      id: f.following.id,
      username: f.following.username,
      displayName: f.following.displayName,
      avatarUrl: f.following.avatarUrl,
      isVerified: f.following.isVerified,
      isFollowing: myFollowingIds.has(f.following.id),
      isMe: authPayload?.userId === f.following.id,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Following error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
