import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { getAIAlerts } from '@/lib/ai-router';

// GET - admin view of AI usage stats + alerts
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayUsage, topUsers, totalConversations, alert] = await Promise.all([
      prisma.aIUsageDaily.aggregate({
        where: { date: today },
        _sum: { requestCount: true, tokensUsed: true },
      }),
      prisma.aIUsageDaily.findMany({
        where: { date: today },
        orderBy: { requestCount: 'desc' },
        take: 20,
        include: { user: { select: { id: true, username: true, displayName: true, plan: true } } },
      }),
      prisma.aIConversation.count(),
      getAIAlerts(),
    ]);

    return NextResponse.json({
      alert,
      today: {
        requests: todayUsage._sum.requestCount || 0,
        tokens: todayUsage._sum.tokensUsed || 0,
        capacity: alert.totalCapacity,
      },
      topUsers,
      totalConversations,
    });
  } catch (error) {
    console.error('Admin AI usage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
