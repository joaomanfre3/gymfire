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
        plan: true, aiEnabled: true, aiLimitOverride: true,
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
    case 'edit':
      if (value?.displayName) updates.displayName = value.displayName;
      if (value?.username) updates.username = value.username;
      if (value?.email) updates.email = value.email;
      if (value?.bio !== undefined) updates.bio = value.bio;
      if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nenhum campo para editar' }, { status: 400 });
      break;
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

// DELETE - delete user
export async function DELETE(request: Request) {
  const admin = await getAdminUser(request);
  if (!admin) return adminUnauthorized();

  const { userId } = await request.json();
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 });
  if (userId === admin.id) return NextResponse.json({ error: 'Não pode deletar a si mesmo' }, { status: 400 });

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ success: true });
}

// POST - create user or impersonate
export async function POST(request: Request) {
  const admin = await getAdminUser(request);
  if (!admin) return adminUnauthorized();

  const { action, ...data } = await request.json();

  if (action === 'impersonate') {
    const target = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!target) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    // Return user data for client-side impersonation
    return NextResponse.json({
      id: target.id,
      username: target.username,
      displayName: target.displayName,
      email: target.email,
      role: target.role,
    });
  }

  if (action === 'create') {
    const { username, displayName, email, password } = data;
    if (!username || !displayName || !email || !password) {
      return NextResponse.json({ error: 'username, displayName, email e password são obrigatórios' }, { status: 400 });
    }
    const { hashPassword } = await import('@/lib/auth');
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { username, displayName, email, passwordHash: hashed },
      select: { id: true, username: true, displayName: true, email: true, role: true },
    });
    return NextResponse.json(user, { status: 201 });
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
}
