import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET - get single user details (admin)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await getAuthUser(request);
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { userId } = await params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, username: true, displayName: true, email: true, bio: true,
        avatarUrl: true, role: true, isVerified: true, isPremium: true,
        totalPoints: true, currentStreak: true, longestStreak: true,
        createdAt: true, updatedAt: true, lastWorkoutAt: true,
        _count: { select: { workouts: true, posts: true, followers: true, following: true } },
      },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ ...user, workoutsCount: user._count.workouts, postsCount: user._count.posts, followersCount: user._count.followers, followingCount: user._count.following });
  } catch (error) {
    console.error('Admin get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - update user (admin)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await getAuthUser(request);
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { userId } = await params;
    const body = await request.json();
    const { displayName, username, email, bio, role, isVerified, isPremium, isBanned, plan, aiEnabled, aiLimitOverride } = body;

    const updateData: Record<string, unknown> = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (role !== undefined) updateData.role = role;
    if (isVerified !== undefined) updateData.isVerified = isVerified;
    if (isPremium !== undefined) updateData.isPremium = isPremium;
    if (plan !== undefined) updateData.plan = plan;
    if (aiEnabled !== undefined) updateData.aiEnabled = aiEnabled;
    if (aiLimitOverride !== undefined) updateData.aiLimitOverride = aiLimitOverride;
    if (isBanned !== undefined) {
      // Ban = set role to USER and add a prefix to username to prevent login
      if (isBanned) {
        updateData.username = `banned_${Date.now()}_${username || ''}`;
        updateData.email = `banned_${Date.now()}_${email || ''}`;
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, username: true, displayName: true, email: true, role: true, isVerified: true, isPremium: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - delete user (admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await getAuthUser(request);
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { userId } = await params;
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
