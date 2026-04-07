import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (post.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { caption } = await request.json();
    const updated = await prisma.post.update({
      where: { id },
      data: { caption: caption?.trim() || post.caption },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Post update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (post.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Post delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
