import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, createAccessToken, createRefreshToken } from '@/lib/auth';

// POST - impersonate a user (admin only)
export async function POST(request: Request) {
  try {
    const admin = await getAuthUser(request);
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, displayName: true, email: true, role: true },
    });
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Generate tokens for the target user
    const accessToken = createAccessToken(targetUser.id, targetUser.username);
    const refreshToken = createRefreshToken(targetUser.id);

    // Store refresh token
    await prisma.refreshToken.create({
      data: { userId: targetUser.id, token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        displayName: targetUser.displayName,
        email: targetUser.email,
        role: targetUser.role,
      },
      impersonating: true,
    });
  } catch (error) {
    console.error('Impersonate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
