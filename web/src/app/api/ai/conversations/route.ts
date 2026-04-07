import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET - list user's AI conversations
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const conversations = await prisma.aIConversation.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('AI conversations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - create new conversation
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const conv = await prisma.aIConversation.create({
      data: { userId: user.id },
      select: { id: true, title: true, createdAt: true },
    });

    return NextResponse.json(conv, { status: 201 });
  } catch (error) {
    console.error('Create AI conversation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
