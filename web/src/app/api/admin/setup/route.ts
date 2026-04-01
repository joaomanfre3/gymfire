import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthPayload } from '@/lib/auth';

// First-time admin setup: promotes a user to admin if no admins exist yet,
// OR if the requesting user already is admin
export async function POST(request: Request) {
  const payload = getAuthPayload(request);
  if (!payload) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { userId } = await request.json();
  const targetId = userId || payload.userId;

  // Check if requester is already admin
  const requester = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!requester) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
  }

  if (requester.role === 'ADMIN') {
    // Admin promoting someone else
    const user = await prisma.user.update({
      where: { id: targetId },
      data: { role: 'ADMIN', isVerified: true },
    });
    return NextResponse.json({ message: 'Usuário promovido a admin', user });
  }

  // Self-promotion: only if no admins exist
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  if (adminCount > 0) {
    return NextResponse.json({ error: 'Já existe um admin. Peça ao admin para promover você.' }, { status: 403 });
  }

  const user = await prisma.user.update({
    where: { id: payload.userId },
    data: { role: 'ADMIN', isVerified: true },
  });

  return NextResponse.json({ message: 'Você é o primeiro admin!', user });
}
