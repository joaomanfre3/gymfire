import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET - list cuts (videos) with pagination
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor');
    const take = 10;

    const cuts = await prisma.post.findMany({
      where: { type: 'CUT', visibility: 'PUBLIC' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        likes: user ? { where: { userId: user.id }, select: { id: true }, take: 1 } : false,
      },
    });

    const hasMore = cuts.length > take;
    const items = hasMore ? cuts.slice(0, take) : cuts;

    const results = items.map(c => ({
      id: c.id,
      videoUrl: c.mediaUrls[0] || '',
      caption: c.caption,
      createdAt: c.createdAt,
      user: c.user,
      likes: c.likesCount,
      comments: c.commentsCount,
      isLiked: user && Array.isArray(c.likes) ? c.likes.length > 0 : false,
    }));

    return NextResponse.json({
      cuts: results,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    });
  } catch (error) {
    console.error('Cuts list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - create a cut
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { videoUrl, caption } = await request.json();
    if (!videoUrl) return NextResponse.json({ error: 'videoUrl required' }, { status: 400 });

    const cut = await prisma.post.create({
      data: {
        userId: user.id,
        type: 'CUT',
        mediaUrls: [videoUrl],
        caption: caption || null,
        visibility: 'PUBLIC',
      },
    });

    return NextResponse.json({ id: cut.id }, { status: 201 });
  } catch (error) {
    console.error('Create cut error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
