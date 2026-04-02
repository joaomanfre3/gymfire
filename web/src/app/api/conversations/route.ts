import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET - list user's conversations
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId: user.id } },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true, senderId: true },
        },
      },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
    });

    const result = conversations.map(c => {
      const otherParticipants = c.participants.filter(p => p.userId !== user.id);
      const lastMessage = c.messages[0] || null;
      const myParticipant = c.participants.find(p => p.userId === user.id);
      const unread = lastMessage && myParticipant?.lastReadAt
        ? new Date(lastMessage.createdAt) > new Date(myParticipant.lastReadAt)
        : !!lastMessage;

      return {
        id: c.id,
        type: c.type,
        name: c.type === 'DIRECT' ? otherParticipants[0]?.user.displayName : c.name,
        avatar: c.type === 'DIRECT' ? otherParticipants[0]?.user.avatarUrl : c.avatarUrl,
        username: c.type === 'DIRECT' ? otherParticipants[0]?.user.username : null,
        userId: c.type === 'DIRECT' ? otherParticipants[0]?.user.id : null,
        memberCount: c.type === 'GROUP' ? c.participants.length : undefined,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          isOwn: lastMessage.senderId === user.id,
        } : null,
        unread,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Conversations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - create or find direct conversation
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { targetUserId } = await request.json();
    if (!targetUserId) return NextResponse.json({ error: 'targetUserId required' }, { status: 400 });

    // Check if direct conversation already exists
    const existing = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { participants: { some: { userId: user.id } } },
          { participants: { some: { userId: targetUserId } } },
        ],
      },
    });

    if (existing) return NextResponse.json({ conversationId: existing.id });

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        type: 'DIRECT',
        participants: {
          create: [
            { userId: user.id },
            { userId: targetUserId },
          ],
        },
      },
    });

    return NextResponse.json({ conversationId: conversation.id }, { status: 201 });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
