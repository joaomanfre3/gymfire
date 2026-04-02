import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// POST - add member to group
export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { groupId } = await params;
    const { userId: targetUserId } = await request.json();

    // Verify requester is OWNER or ADMIN
    const myParticipant = await prisma.participant.findUnique({
      where: { conversationId_userId: { conversationId: groupId, userId: user.id } },
    });
    if (!myParticipant || (myParticipant.role !== 'OWNER' && myParticipant.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Add member
    await prisma.participant.create({
      data: { conversationId: groupId, userId: targetUserId, role: 'MEMBER' },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Add member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - remove member or leave group
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { groupId } = await params;
    const { userId: targetUserId } = await request.json();

    const isLeavingSelf = targetUserId === user.id;

    if (!isLeavingSelf) {
      // Verify requester is OWNER or ADMIN
      const myParticipant = await prisma.participant.findUnique({
        where: { conversationId_userId: { conversationId: groupId, userId: user.id } },
      });
      if (!myParticipant || (myParticipant.role !== 'OWNER' && myParticipant.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
      }
    }

    await prisma.participant.delete({
      where: { conversationId_userId: { conversationId: groupId, userId: targetUserId } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
