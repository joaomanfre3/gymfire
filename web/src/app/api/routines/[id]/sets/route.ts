import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function POST(
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
      return NextResponse.json(
        { error: 'Routine not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { exerciseId, order, sets, reps, restSeconds } = body;

    if (!exerciseId || order === undefined || !sets || !reps) {
      return NextResponse.json(
        { error: 'exerciseId, order, sets, and reps are required' },
        { status: 400 }
      );
    }

    const routineSet = await prisma.routineSet.create({
      data: {
        routineId: id,
        exerciseId,
        order,
        sets,
        reps,
        restSeconds: restSeconds ?? 90,
      },
      include: { exercise: true },
    });

    return NextResponse.json(routineSet, { status: 201 });
  } catch (error) {
    console.error('Routine set create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
