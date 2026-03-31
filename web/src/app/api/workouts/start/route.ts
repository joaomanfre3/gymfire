import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { routineId, title } = body;

    const workout = await prisma.workout.create({
      data: {
        userId: user.id,
        routineId: routineId || null,
        title: title || null,
        startedAt: new Date(),
      },
      include: {
        routine: true,
        sets: true,
      },
    });

    return NextResponse.json(workout, { status: 201 });
  } catch (error) {
    console.error('Workout start error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
