import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// POST - toggle like on a drop
export async function POST(
  request: Request,
  { params }: { params: Promise<{ dropId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { dropId } = await params;

    const existing = await prisma.speedLike.findUnique({
      where: { speedId_userId: { speedId: dropId, userId: user.id } },
    });

    if (existing) {
      await prisma.speedLike.delete({ where: { id: existing.id } });
      return NextResponse.json({ liked: false });
    }

    await prisma.speedLike.create({
      data: { speedId: dropId, userId: user.id },
    });

    // Notify drop owner
    const drop = await prisma.speed.findUnique({ where: { id: dropId }, select: { userId: true } });
    if (drop && drop.userId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: drop.userId,
          type: 'SPEED_REACTION',
          title: 'Curtida no Drop',
          body: `${user.displayName} curtiu seu drop`,
          data: { speedId: dropId, fromUserId: user.id },
        },
      }).catch(() => {});
    }

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error('Like drop error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
