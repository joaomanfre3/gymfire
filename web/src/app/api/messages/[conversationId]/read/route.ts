import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { triggerEvent } from '@/lib/pusher-server';

// POST - mark messages as read
export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId } = await params;
    const { messageIds } = await request.json();

    if (!messageIds?.length) return NextResponse.json({ error: 'messageIds required' }, { status: 400 });

    await prisma.messageRead.createMany({
      data: messageIds.map((id: string) => ({ messageId: id, userId: user.id })),
      skipDuplicates: true,
    });

    await prisma.participant.update({
      where: { conversationId_userId: { conversationId, userId: user.id } },
      data: { lastReadAt: new Date() },
    });

    triggerEvent(`chat-${conversationId}`, 'messages-read', {
      readByUserId: user.id,
      messageIds,
      readAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Read receipt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
