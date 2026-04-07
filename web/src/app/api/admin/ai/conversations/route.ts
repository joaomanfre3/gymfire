import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET - browse all AI conversations (admin)
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;

    const where = search
      ? { user: { OR: [{ username: { contains: search, mode: 'insensitive' as const } }, { displayName: { contains: search, mode: 'insensitive' as const } }] } }
      : {};

    const [conversations, total] = await Promise.all([
      prisma.aIConversation.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, username: true, displayName: true, plan: true } },
          _count: { select: { messages: true } },
        },
      }),
      prisma.aIConversation.count({ where }),
    ]);

    return NextResponse.json({ conversations, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Admin AI conversations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
