import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// POST - toggle like on a cut
export async function POST(
  request: Request,
  { params }: { params: Promise<{ cutId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { cutId } = await params;

    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId: user.id, postId: cutId } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      await prisma.post.update({ where: { id: cutId }, data: { likesCount: { decrement: 1 } } });
      return NextResponse.json({ liked: false });
    } else {
      await prisma.like.create({ data: { userId: user.id, postId: cutId } });
      await prisma.post.update({ where: { id: cutId }, data: { likesCount: { increment: 1 } } });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('Like cut error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
