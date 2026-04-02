import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { triggerEvent } from '@/lib/pusher-server';

// GET - list messages in conversation
export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId } = await params;

    // Verify user is participant
    const participant = await prisma.participant.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.id } },
    });
    if (!participant) return NextResponse.json({ error: 'Not a participant' }, { status: 403 });

    const messages = await prisma.message.findMany({
      where: { conversationId, isDeleted: false },
      orderBy: { createdAt: 'asc' },
      take: 100,
      select: {
        id: true,
        content: true,
        senderId: true,
        createdAt: true,
        type: true,
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    // Mark as read
    await prisma.participant.update({
      where: { conversationId_userId: { conversationId, userId: user.id } },
      data: { lastReadAt: new Date() },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - send message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId } = await params;
    const { content } = await request.json();

    if (!content?.trim()) return NextResponse.json({ error: 'Content required' }, { status: 400 });

    // Verify user is participant
    const participant = await prisma.participant.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.id } },
    });
    if (!participant) return NextResponse.json({ error: 'Not a participant' }, { status: 403 });

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        content: content.trim(),
        type: 'TEXT',
      },
      select: {
        id: true,
        content: true,
        senderId: true,
        createdAt: true,
        type: true,
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    // Update conversation lastMessage
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date(), lastMessageId: message.id },
    });

    // Update read status for sender
    await prisma.participant.update({
      where: { conversationId_userId: { conversationId, userId: user.id } },
      data: { lastReadAt: new Date() },
    });

    // Trigger real-time event
    triggerEvent(`chat-${conversationId}`, 'new-message', {
      ...message,
      conversationId,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
