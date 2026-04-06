import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { triggerEvent } from '@/lib/pusher-server';

const MESSAGE_SELECT = {
  id: true,
  content: true,
  senderId: true,
  createdAt: true,
  type: true,
  mediaUrl: true,
  mediaType: true,
  isEdited: true,
  editedAt: true,
  isDeleted: true,
  deletedForAll: true,
  deletedForUserIds: true,
  replyToId: true,
  audioDuration: true,
  fileName: true,
  fileSize: true,
  replyTo: {
    select: {
      id: true,
      content: true,
      senderId: true,
      type: true,
      sender: { select: { id: true, displayName: true } },
    },
  },
  sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  readBy: { select: { userId: true, readAt: true } },
} as const;

// GET - list messages
export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId } = await params;

    const participant = await prisma.participant.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.id } },
    });
    if (!participant) return NextResponse.json({ error: 'Not a participant' }, { status: 403 });

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        // Exclude messages deleted for all, but include ones deleted for specific users (we filter client-side)
        deletedForAll: false,
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
      select: MESSAGE_SELECT,
    });

    // Filter out messages deleted for this user
    const filtered = messages.filter(m => !m.deletedForUserIds.includes(user.id));

    // Mark as read
    await prisma.participant.update({
      where: { conversationId_userId: { conversationId, userId: user.id } },
      data: { lastReadAt: new Date() },
    });

    // Create read receipts for all unread messages from other senders
    const unreadFromOthers = filtered.filter(m =>
      m.senderId !== user.id && !m.readBy.some(r => r.userId === user.id)
    );
    if (unreadFromOthers.length > 0) {
      await prisma.messageRead.createMany({
        data: unreadFromOthers.map(m => ({ messageId: m.id, userId: user.id })),
        skipDuplicates: true,
      });

      // Notify senders that messages were read
      triggerEvent(`chat-${conversationId}`, 'messages-read', {
        readByUserId: user.id,
        messageIds: unreadFromOthers.map(m => m.id),
        readAt: new Date().toISOString(),
      });
    }

    return NextResponse.json(filtered);
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
    const body = await request.json();
    const { content, type, mediaUrl, mediaType, replyToId, audioDuration, fileName, fileSize } = body;

    if (!content?.trim() && !mediaUrl) {
      return NextResponse.json({ error: 'Content or media required' }, { status: 400 });
    }

    const participant = await prisma.participant.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.id } },
    });
    if (!participant) return NextResponse.json({ error: 'Not a participant' }, { status: 403 });

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        content: content?.trim() || null,
        type: type || 'TEXT',
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        replyToId: replyToId || null,
        audioDuration: audioDuration || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
      },
      select: MESSAGE_SELECT,
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date(), lastMessageId: message.id },
    });

    await prisma.participant.update({
      where: { conversationId_userId: { conversationId, userId: user.id } },
      data: { lastReadAt: new Date() },
    });

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

// PATCH - edit message
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId } = await params;
    const { messageId, content } = await request.json();

    if (!messageId || !content?.trim()) {
      return NextResponse.json({ error: 'messageId and content required' }, { status: 400 });
    }

    const msg = await prisma.message.findUnique({ where: { id: messageId } });
    if (!msg || msg.conversationId !== conversationId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (msg.senderId !== user.id) {
      return NextResponse.json({ error: 'Only sender can edit' }, { status: 403 });
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { content: content.trim(), isEdited: true, editedAt: new Date() },
      select: MESSAGE_SELECT,
    });

    triggerEvent(`chat-${conversationId}`, 'message-edited', {
      ...updated,
      conversationId,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Edit message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - delete message (for me or for all)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const forAll = searchParams.get('forAll') === 'true';

    if (!messageId) return NextResponse.json({ error: 'messageId required' }, { status: 400 });

    const msg = await prisma.message.findUnique({ where: { id: messageId } });
    if (!msg || msg.conversationId !== conversationId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (forAll) {
      // Only the sender can delete for everyone
      if (msg.senderId !== user.id) {
        return NextResponse.json({ error: 'Only sender can delete for all' }, { status: 403 });
      }
      await prisma.message.update({
        where: { id: messageId },
        data: { deletedForAll: true, content: null, mediaUrl: null },
      });

      triggerEvent(`chat-${conversationId}`, 'message-deleted', {
        messageId,
        conversationId,
        forAll: true,
      });
    } else {
      // Delete for me only
      await prisma.message.update({
        where: { id: messageId },
        data: { deletedForUserIds: { push: user.id } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
