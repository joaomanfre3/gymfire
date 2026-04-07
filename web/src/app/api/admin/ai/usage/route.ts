import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET - admin view of AI usage stats
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayUsage, providers, topUsers, totalConversations] = await Promise.all([
      // Today's total usage
      prisma.aIUsageDaily.aggregate({
        where: { date: today },
        _sum: { requestCount: true, tokensUsed: true },
      }),
      // Provider status
      prisma.aIProvider.findMany({
        orderBy: { priority: 'asc' },
        select: { name: true, displayName: true, isEnabled: true, maxRPD: true, todayUsed: true, quality: true },
      }),
      // Top users today
      prisma.aIUsageDaily.findMany({
        where: { date: today },
        orderBy: { requestCount: 'desc' },
        take: 20,
        include: { user: { select: { id: true, username: true, displayName: true, plan: true } } },
      }),
      // Total conversations
      prisma.aIConversation.count(),
    ]);

    const totalCapacity = providers.filter(p => p.isEnabled).reduce((sum, p) => sum + p.maxRPD, 0);

    return NextResponse.json({
      today: {
        requests: todayUsage._sum.requestCount || 0,
        tokens: todayUsage._sum.tokensUsed || 0,
        capacity: totalCapacity,
      },
      providers,
      topUsers,
      totalConversations,
    });
  } catch (error) {
    console.error('Admin AI usage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
