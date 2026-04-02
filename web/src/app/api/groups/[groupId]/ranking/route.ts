import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET - ranking isolated to group members only
export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { groupId } = await params;

    // Verify user is in the group
    const participant = await prisma.participant.findUnique({
      where: { conversationId_userId: { conversationId: groupId, userId: user.id } },
    });
    if (!participant) return NextResponse.json({ error: 'Not a member' }, { status: 403 });

    // Get all group members with their stats
    const members = await prisma.participant.findMany({
      where: { conversationId: groupId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            totalPoints: true,
            currentStreak: true,
            longestStreak: true,
            isVerified: true,
            _count: {
              select: { workouts: true },
            },
          },
        },
      },
    });

    // Build ranking sorted by totalPoints
    const ranking = members
      .map(m => ({
        id: m.user.id,
        username: m.user.username,
        displayName: m.user.displayName,
        avatarUrl: m.user.avatarUrl,
        totalPoints: m.user.totalPoints,
        currentStreak: m.user.currentStreak,
        longestStreak: m.user.longestStreak,
        isVerified: m.user.isVerified,
        workoutsCount: m.user._count.workouts,
        role: m.role,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((u, i) => ({ ...u, rank: i + 1 }));

    return NextResponse.json(ranking);
  } catch (error) {
    console.error('Group ranking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
