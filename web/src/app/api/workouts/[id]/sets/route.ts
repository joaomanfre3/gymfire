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

    const workout = await prisma.workout.findUnique({ where: { id } });

    if (!workout || workout.userId !== user.id) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    if (workout.finishedAt) {
      return NextResponse.json(
        { error: 'Workout is already finished' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { exerciseId, reps, weight, isWarmup, isDropset, isFailure } = body;

    if (!exerciseId) {
      return NextResponse.json(
        { error: 'exerciseId is required' },
        { status: 400 }
      );
    }

    // Calculate next set number
    const lastSet = await prisma.workoutSet.findFirst({
      where: { workoutId: id },
      orderBy: { setNumber: 'desc' },
    });
    const setNumber = (lastSet?.setNumber ?? 0) + 1;

    // Check for personal records
    let isPR = false;
    const prRecords: Array<{ type: 'MAX_WEIGHT' | 'MAX_REPS'; value: number; previousValue: number | null }> = [];

    if (weight !== undefined && weight !== null && weight > 0) {
      // Check MAX_WEIGHT and MAX_REPS PRs in parallel
      const [maxWeightRecord, maxRepsAtWeight] = await Promise.all([
        prisma.workoutSet.findFirst({
          where: {
            exerciseId,
            workout: { userId: user.id, finishedAt: { not: null } },
            weight: { not: null },
          },
          orderBy: { weight: 'desc' },
        }),
        (reps !== undefined && reps !== null && reps > 0)
          ? prisma.workoutSet.findFirst({
              where: {
                exerciseId,
                workout: { userId: user.id, finishedAt: { not: null } },
                weight,
                reps: { not: null },
              },
              orderBy: { reps: 'desc' },
            })
          : Promise.resolve(null),
      ]);

      const currentMaxWeight = maxWeightRecord?.weight ?? 0;
      if (weight > currentMaxWeight) {
        isPR = true;
        prRecords.push({
          type: 'MAX_WEIGHT',
          value: weight,
          previousValue: currentMaxWeight > 0 ? currentMaxWeight : null,
        });
      }

      if (reps !== undefined && reps !== null && reps > 0) {
        const currentMaxReps = maxRepsAtWeight?.reps ?? 0;
        if (reps > currentMaxReps) {
          isPR = true;
          prRecords.push({
            type: 'MAX_REPS',
            value: reps,
            previousValue: currentMaxReps > 0 ? currentMaxReps : null,
          });
        }
      }
    }

    // Create the set
    const workoutSet = await prisma.workoutSet.create({
      data: {
        workoutId: id,
        exerciseId,
        setNumber,
        reps: reps ?? null,
        weight: weight ?? null,
        isWarmup: isWarmup ?? false,
        isDropset: isDropset ?? false,
        isFailure: isFailure ?? false,
        isPR,
      },
      include: { exercise: true },
    });

    // Create PersonalRecord entries
    if (prRecords.length > 0) {
      await prisma.personalRecord.createMany({
        data: prRecords.map(pr => ({
          userId: user.id,
          exerciseId,
          workoutId: id,
          type: pr.type,
          value: pr.value,
          previousValue: pr.previousValue,
        })),
      });
    }

    return NextResponse.json(workoutSet, { status: 201 });
  } catch (error) {
    console.error('Workout set create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
