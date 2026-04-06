import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET - list comments (only visible to drop owner)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ dropId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { dropId } = await params;

    const drop = await prisma.speed.findUnique({ where: { id: dropId }, select: { userId: true } });
    if (!drop) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Only the drop owner can see all comments
    if (drop.userId !== user.id) {
      // Non-owners can only see their own comments
      const ownComments = await prisma.speedComment.findMany({
        where: { speedId: dropId, userId: user.id },
        include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'asc' },
      });
      return NextResponse.json(ownComments);
    }

    const comments = await prisma.speedComment.findMany({
      where: { speedId: dropId },
      include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Get drop comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - add a comment (sent as private message to drop owner)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ dropId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { dropId } = await params;
    const { text } = await request.json();
    if (!text || !text.trim()) return NextResponse.json({ error: 'Text required' }, { status: 400 });

    const drop = await prisma.speed.findUnique({ where: { id: dropId }, select: { userId: true } });
    if (!drop) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const comment = await prisma.speedComment.create({
      data: {
        speedId: dropId,
        userId: user.id,
        text: text.trim(),
      },
      include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
    });

    // Notify drop owner
    if (drop.userId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: drop.userId,
          type: 'SPEED_COMMENT',
          title: 'Comentário no Drop',
          body: `${user.displayName}: ${text.trim().slice(0, 80)}`,
          data: { speedId: dropId, fromUserId: user.id, commentId: comment.id },
        },
      }).catch(() => {});
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Comment drop error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
