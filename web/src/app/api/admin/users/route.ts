import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminUser, adminUnauthorized } from '@/lib/admin';

export async function GET(request: Request) {
  const admin = await getAdminUser(request);
  if (!admin) return adminUnauthorized();

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search') || '';

  const where = search
    ? {
        OR: [
          { username: { contains: search, mode: 'insensitive' as const } },
          { displayName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, username: true, displayName: true, email: true,
        role: true, isVerified: true, isPremium: true, totalPoints: true,
        currentStreak: true, createdAt: true, bio: true,
        _count: { select: { workouts: true, posts: true, followers: true, following: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function PATCH(request: Request) {
  const admin = await getAdminUser(request);
  if (!admin) return adminUnauthorized();

  const { userId, action, value } = await request.json();
  if (!userId || !action) {
    return NextResponse.json({ error: 'userId e action são obrigatórios' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  switch (action) {
    case 'verify': updates.isVerified = value !== false; break;
    case 'premium': updates.isPremium = value !== false; break;
    case 'promote': updates.role = 'ADMIN'; break;
    case 'demote': updates.role = 'USER'; break;
    default:
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updates,
    select: { id: true, username: true, displayName: true, role: true, isVerified: true, isPremium: true },
  });

  return NextResponse.json(user);
}
