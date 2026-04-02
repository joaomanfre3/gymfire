import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function PUT(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { displayName, username, bio, avatarUrl } = body;

    // Validate displayName
    if (displayName !== undefined && (!displayName || displayName.length < 2)) {
      return NextResponse.json({ error: 'Nome deve ter pelo menos 2 caracteres' }, { status: 400 });
    }

    // Validate username
    if (username !== undefined) {
      if (!username || username.length < 3) {
        return NextResponse.json({ error: 'Username deve ter pelo menos 3 caracteres' }, { status: 400 });
      }
      if (!/^[a-zA-Z0-9._]+$/.test(username)) {
        return NextResponse.json({ error: 'Username inválido' }, { status: 400 });
      }

      // Check if username is taken by another user
      const existing = await prisma.user.findUnique({
        where: { username: username.toLowerCase() },
        select: { id: true },
      });
      if (existing && existing.id !== user.id) {
        return NextResponse.json({ error: 'Username já está em uso' }, { status: 409 });
      }
    }

    // Update user
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(username !== undefined && { username: username.toLowerCase() }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        bio: true,
        avatarUrl: true,
        role: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
