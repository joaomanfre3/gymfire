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

    const followers = await prisma.follow.findMany({
      where: { followingId: user.id },
      include: {
        follower: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Check if the current user follows each follower
    let myFollowingIds: Set<string> = new Set();
    if (authPayload) {
      const myFollows = await prisma.follow.findMany({
        where: { followerId: authPayload.userId },
        select: { followingId: true },
      });
      myFollowingIds = new Set(myFollows.map(f => f.followingId));
    }

    const result = followers.map(f => ({
      id: f.follower.id,
      username: f.follower.username,
      displayName: f.follower.displayName,
      avatarUrl: f.follower.avatarUrl,
      isVerified: f.follower.isVerified,
      isFollowing: myFollowingIds.has(f.follower.id),
      isMe: authPayload?.userId === f.follower.id,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Followers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
