import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// GET - list all providers with usage
export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const providers = await prisma.aIProvider.findMany({ orderBy: { priority: 'asc' } });
    return NextResponse.json(providers);
  } catch (error) {
    console.error('Admin providers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - add new provider
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await request.json();
    const provider = await prisma.aIProvider.create({ data });
    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    console.error('Admin add provider error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - update provider
export async function PUT(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id, ...data } = await request.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const provider = await prisma.aIProvider.update({ where: { id }, data });
    return NextResponse.json(provider);
  } catch (error) {
    console.error('Admin update provider error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - remove provider
export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await prisma.aIProvider.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete provider error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
