import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// DELETE - delete own drop
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ dropId: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { dropId } = await params;

    const drop = await prisma.speed.findUnique({ where: { id: dropId } });
    if (!drop) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (drop.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.speed.delete({ where: { id: dropId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete drop error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
