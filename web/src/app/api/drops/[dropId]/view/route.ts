import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// POST - mark drop as viewed
export async function POST(
  request: Request,
  { params }: { params: Promise<{ dropId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { dropId } = await params;

    // Upsert view (don't fail if already viewed)
    await prisma.speedView.upsert({
      where: {
        speedId_userId: { speedId: dropId, userId: user.id },
      },
      update: {},
      create: {
        speedId: dropId,
        userId: user.id,
      },
    });

    // Increment views count
    await prisma.speed.update({
      where: { id: dropId },
      data: { viewsCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('View drop error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
