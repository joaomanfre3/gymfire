import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { triggerEvent, CHANNELS, EVENTS } from '@/lib/pusher-server';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { caption, type, visibility, workoutId } = body;

    const post = await prisma.post.create({
      data: {
        userId: user.id,
        caption: caption || null,
        type: type || 'WORKOUT',
        visibility: visibility || 'PUBLIC',
        workoutId: workoutId || null,
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
            },
          },
        },
      },
    });

    // Trigger real-time event for new post
    triggerEvent(CHANNELS.FEED, EVENTS.NEW_POST, {
      postId: post.id,
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Post create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
