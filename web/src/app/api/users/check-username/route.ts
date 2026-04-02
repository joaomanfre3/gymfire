import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username || username.length < 3) {
      return NextResponse.json({ available: false, error: 'Username deve ter pelo menos 3 caracteres' });
    }

    if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      return NextResponse.json({ available: false, error: 'Apenas letras, números, pontos e underscores' });
    }

    const existing = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    });

    return NextResponse.json({ available: !existing });
  } catch (error) {
    console.error('Check username error:', error);
    return NextResponse.json({ available: false, error: 'Erro interno' }, { status: 500 });
  }
}
