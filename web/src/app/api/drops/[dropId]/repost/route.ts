import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// POST - repost a drop (creates a new drop referencing original media)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ dropId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { dropId } = await params;

    const original = await prisma.speed.findUnique({
      where: { id: dropId },
      include: { user: { select: { id: true, username: true, displayName: true } } },
    });
    if (!original) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Check if already reposted
    const existing = await prisma.speedRepost.findUnique({
      where: { speedId_userId: { speedId: dropId, userId: user.id } },
    });
    if (existing) return NextResponse.json({ error: 'Already reposted' }, { status: 409 });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create the repost record and a new drop with the same media
    const [repost, newDrop] = await prisma.$transaction([
      prisma.speedRepost.create({
        data: { speedId: dropId, userId: user.id },
      }),
      prisma.speed.create({
        data: {
          userId: user.id,
          mediaUrl: original.mediaUrl,
          mediaType: original.mediaType,
          caption: original.caption
            ? `📤 Repost de @${original.user.username}: ${original.caption}`
            : `📤 Repost de @${original.user.username}`,
          duration: original.duration,
          expiresAt,
        },
      }),
    ]);

    // Notify original author
    if (original.userId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: original.userId,
          type: 'SPEED_REPOST',
          title: 'Repost do Drop',
          body: `${user.displayName} repostou seu drop`,
          data: { speedId: dropId, newSpeedId: newDrop.id, fromUserId: user.id },
        },
      }).catch(() => {});
    }

    return NextResponse.json({ repostId: repost.id, newDropId: newDrop.id }, { status: 201 });
  } catch (error) {
    console.error('Repost drop error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
