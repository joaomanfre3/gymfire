import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET - list drops from followed users + own (last 24h)
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();

    // Get user IDs: self + following
    const following = await prisma.follow.findMany({
      where: { followerId: user.id },
      select: { followingId: true },
    });
    const userIds = [user.id, ...following.map(f => f.followingId)];

    // Fetch active (non-expired, non-archived) drops
    const drops = await prisma.speed.findMany({
      where: {
        userId: { in: userIds },
        expiresAt: { gt: now },
        isArchived: false,
      },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        views: {
          where: { userId: user.id },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by user
    const userDropsMap = new Map<string, {
      userId: string;
      username: string;
      displayName: string;
      avatarUrl: string | null;
      drops: Array<{
        id: string;
        mediaUrl: string;
        mediaType: string;
        caption: string | null;
        duration: number;
        createdAt: Date;
        seen: boolean;
      }>;
      allSeen: boolean;
    }>();

    for (const drop of drops) {
      const uid = drop.userId;
      const seen = drop.views.length > 0;

      if (!userDropsMap.has(uid)) {
        userDropsMap.set(uid, {
          userId: uid,
          username: drop.user.username,
          displayName: drop.user.displayName,
          avatarUrl: drop.user.avatarUrl,
          drops: [],
          allSeen: true,
        });
      }

      const entry = userDropsMap.get(uid)!;
      entry.drops.push({
        id: drop.id,
        mediaUrl: drop.mediaUrl,
        mediaType: drop.mediaType,
        caption: drop.caption,
        duration: drop.duration,
        createdAt: drop.createdAt,
        seen,
      });
      if (!seen) entry.allSeen = false;
    }

    // Sort: unseen first, then seen
    const result = Array.from(userDropsMap.values()).sort((a, b) => {
      // Own drops always first
      if (a.userId === user.id) return -1;
      if (b.userId === user.id) return 1;
      // Unseen before seen
      if (!a.allSeen && b.allSeen) return -1;
      if (a.allSeen && !b.allSeen) return 1;
      return 0;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Drops error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - create a drop
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { mediaUrl, mediaType, caption, duration } = await request.json();
    if (!mediaUrl) return NextResponse.json({ error: 'mediaUrl required' }, { status: 400 });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const drop = await prisma.speed.create({
      data: {
        userId: user.id,
        mediaUrl,
        mediaType: mediaType || 'IMAGE',
        caption: caption || null,
        duration: duration || 5000,
        expiresAt,
      },
    });

    return NextResponse.json({ id: drop.id }, { status: 201 });
  } catch (error) {
    console.error('Create drop error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
