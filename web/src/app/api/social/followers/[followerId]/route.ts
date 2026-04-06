import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// DELETE - remove a follower (someone who follows me)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ followerId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { followerId } = await params;

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: user.id,
        },
      },
    });

    if (!follow) return NextResponse.json({ error: 'Follower not found' }, { status: 404 });

    await prisma.follow.delete({ where: { id: follow.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove follower error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
