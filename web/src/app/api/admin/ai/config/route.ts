import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET - get all AI config
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const configs = await prisma.aIConfig.findMany();
    const result: Record<string, unknown> = {};
    for (const c of configs) result[c.key] = c.value;

    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin AI config error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - update AI config
export async function PUT(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updates = await request.json();

    for (const [key, value] of Object.entries(updates)) {
      await prisma.aIConfig.upsert({
        where: { key },
        update: { value: value as never },
        create: { key, value: value as never },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin AI config update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
