import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username')?.trim().toLowerCase();

    if (!username || username.length < 3) {
      return NextResponse.json({ available: false, error: 'Username deve ter pelo menos 3 caracteres' });
    }

    if (!/^[a-z0-9._]+$/.test(username)) {
      return NextResponse.json({ available: false, error: 'Apenas letras, números, pontos e underscores' });
    }

    if (username.length > 30) {
      return NextResponse.json({ available: false, error: 'Máximo 30 caracteres' });
    }

    const existing = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    return NextResponse.json({ available: !existing });
  } catch (error) {
    console.error('Check username error:', error);
    return NextResponse.json({ available: false, error: 'Erro ao verificar disponibilidade' }, { status: 500 });
  }
}
