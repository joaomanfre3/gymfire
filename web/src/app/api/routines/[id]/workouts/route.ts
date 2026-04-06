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
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    const body = await request.json();
    const { day, name, exercises } = body;

    if (!day || !name) {
      return NextResponse.json(
        { error: 'Day and name are required' },
        { status: 400 }
      );
    }

    const existingCount = await prisma.routineWorkout.count({
      where: { routineId: id, day },
    });

    const workout = await prisma.routineWorkout.create({
      data: {
        routineId: id,
        day,
        name,
        order: existingCount,
        exercises: {
          create: (exercises || []).map((ex: { exerciseId: string; sets: number; reps: number; weight: number }, i: number) => ({
            exerciseId: ex.exerciseId,
            order: i,
            sets: ex.sets || 3,
            reps: ex.reps || 12,
            weight: ex.weight || 0,
          })),
        },
      },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(workout, { status: 201 });
  } catch (error) {
    console.error('Routine workout create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workoutId = searchParams.get('workoutId');

    if (!workoutId) {
      return NextResponse.json({ error: 'workoutId is required' }, { status: 400 });
    }

    const workout = await prisma.routineWorkout.findUnique({
      where: { id: workoutId },
      include: { routine: true },
    });

    if (!workout || workout.routine.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.routineWorkout.delete({ where: { id: workoutId } });

    return NextResponse.json({ message: 'Workout deleted' });
  } catch (error) {
    console.error('Routine workout delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workoutId, exercises } = body;

    if (!workoutId) {
      return NextResponse.json({ error: 'workoutId is required' }, { status: 400 });
    }

    const workout = await prisma.routineWorkout.findUnique({
      where: { id: workoutId },
      include: { routine: true },
    });

    if (!workout || workout.routine.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Replace all exercises
    await prisma.routineWorkoutExercise.deleteMany({ where: { workoutId } });

    if (exercises && exercises.length > 0) {
      await prisma.routineWorkoutExercise.createMany({
        data: exercises.map((ex: { exerciseId: string; sets: number; reps: number; weight: number }, i: number) => ({
          workoutId,
          exerciseId: ex.exerciseId,
          order: i,
          sets: ex.sets || 3,
          reps: ex.reps || 12,
          weight: ex.weight || 0,
        })),
      });
    }

    const updated = await prisma.routineWorkout.findUnique({
      where: { id: workoutId },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Routine workout update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
