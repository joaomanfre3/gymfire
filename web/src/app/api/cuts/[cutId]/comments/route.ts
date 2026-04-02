import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET - list comments for a cut
export async function GET(
  request: Request,
  { params }: { params: Promise<{ cutId: string }> }
) {
  try {
    const { cutId } = await params;

    const comments = await prisma.comment.findMany({
      where: { postId: cutId, parentId: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Comments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - add comment to a cut
export async function POST(
  request: Request,
  { params }: { params: Promise<{ cutId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { cutId } = await params;
    const { content } = await request.json();
    if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 });

    const comment = await prisma.comment.create({
      data: { userId: user.id, postId: cutId, content: content.trim() },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    await prisma.post.update({ where: { id: cutId }, data: { commentsCount: { increment: 1 } } });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Add comment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
