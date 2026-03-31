import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: id,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json(
        { error: 'Already liked this post' },
        { status: 409 }
      );
    }

    const like = await prisma.like.create({
      data: {
        userId: user.id,
        postId: id,
      },
    });

    await prisma.post.update({
      where: { id },
      data: { likesCount: { increment: 1 } },
    });

    return NextResponse.json(like, { status: 201 });
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const like = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: id,
        },
      },
    });

    if (!like) {
      return NextResponse.json(
        { error: 'Like not found' },
        { status: 404 }
      );
    }

    await prisma.like.delete({ where: { id: like.id } });

    await prisma.post.update({
      where: { id },
      data: { likesCount: { decrement: 1 } },
    });

    return NextResponse.json({ message: 'Like removed' });
  } catch (error) {
    console.error('Unlike error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
