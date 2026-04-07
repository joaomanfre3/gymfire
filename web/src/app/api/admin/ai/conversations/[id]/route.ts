import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET - read specific conversation (admin)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    const conv = await prisma.aIConversation.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, displayName: true, plan: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true, role: true, content: true, intent: true,
            blocked: true, provider: true, tokensUsed: true, latencyMs: true, createdAt: true,
          },
        },
      },
    });

    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(conv);
  } catch (error) {
    console.error('Admin AI conversation detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
