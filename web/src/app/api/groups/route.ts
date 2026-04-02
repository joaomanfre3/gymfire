import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET - list user's groups
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const groups = await prisma.conversation.findMany({
      where: {
        type: 'GROUP',
        participants: { some: { userId: user.id } },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, displayName: true, avatarUrl: true, totalPoints: true, currentStreak: true } },
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

    const result = groups.map(g => ({
      id: g.id,
      name: g.name || 'Grupo sem nome',
      avatar: g.avatarUrl,
      memberCount: g.participants.length,
      members: g.participants.map(p => ({
        id: p.user.id,
        username: p.user.username,
        displayName: p.user.displayName,
        avatarUrl: p.user.avatarUrl,
        role: p.role,
      })),
      lastMessage: g.messages[0] ? {
        content: g.messages[0].content,
        createdAt: g.messages[0].createdAt,
      } : null,
      myRole: g.participants.find(p => p.userId === user.id)?.role || 'MEMBER',
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Groups error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - create group
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, memberIds } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Nome do grupo é obrigatório' }, { status: 400 });

    // Ensure creator is included
    const allMembers = new Set<string>([user.id, ...(memberIds || [])]);

    const group = await prisma.conversation.create({
      data: {
        type: 'GROUP',
        name: name.trim(),
        participants: {
          create: Array.from(allMembers).map(uid => ({
            userId: uid,
            role: uid === user.id ? 'OWNER' : 'MEMBER',
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          },
        },
      },
    });

    return NextResponse.json({
      id: group.id,
      name: group.name,
      memberCount: group.participants.length,
    }, { status: 201 });
  } catch (error) {
    console.error('Create group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
