import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const routine = await prisma.routine.findUnique({
      where: { id },
      include: {
        routineWorkouts: {
          include: {
            exercises: {
              include: { exercise: true },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    if (routine.userId !== user.id && !routine.isPublic) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    return NextResponse.json(routine);
  } catch (error) {
    console.error('Routine detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const routine = await prisma.routine.findUnique({ where: { id } });

    if (!routine || routine.userId !== user.id) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, isActive } = body;

    // If activating this routine, deactivate all others
    if (isActive === true) {
      await prisma.routine.updateMany({
        where: { userId: user.id, isActive: true },
        data: { isActive: false },
      });
    }

    const updated = await prisma.routine.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        routineWorkouts: {
          include: {
            exercises: {
              include: { exercise: true },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Routine update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const routine = await prisma.routine.findUnique({ where: { id } });

    if (!routine || routine.userId !== user.id) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    await prisma.routine.delete({ where: { id } });

    return NextResponse.json({ message: 'Routine deleted' });
  } catch (error) {
    console.error('Routine delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
