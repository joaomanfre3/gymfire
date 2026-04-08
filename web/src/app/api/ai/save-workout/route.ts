import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

interface WorkoutExercise {
  nome: string;
  series: number;
  reps: number;
  descanso: number;
}

interface SingleWorkout {
  nome: string;
  exercicios: WorkoutExercise[];
}

interface SaveWorkoutBody {
  nome: string;
  exercicios?: WorkoutExercise[];
  treinos?: SingleWorkout[];     // For weekly plans (multiple workouts)
  routineId?: string;            // Add to existing routine
  replace?: boolean;             // Replace all sets in existing routine
}

async function resolveExerciseId(nome: string, userId: string): Promise<string> {
  const slug = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  let exercise = await prisma.exercise.findFirst({
    where: {
      OR: [
        { name: { equals: nome, mode: 'insensitive' } },
        { slug },
        { aliases: { some: { name: { equals: nome, mode: 'insensitive' } } } },
      ],
    },
  });

  if (!exercise) {
    let uniqueSlug = slug;
    let counter = 1;
    while (await prisma.exercise.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    exercise = await prisma.exercise.create({
      data: {
        name: nome,
        slug: uniqueSlug,
        muscleGroup: 'OTHER',
        equipment: 'OTHER',
        category: 'STRENGTH',
        isPublic: true,
        isFromLibrary: false,
        createdById: userId,
      },
    });
  }

  return exercise.id;
}

async function createSetsForWorkout(
  routineId: string,
  workout: SingleWorkout,
  startOrder: number,
  userId: string,
): Promise<number> {
  let order = startOrder;
  for (const ex of workout.exercicios) {
    const exerciseId = await resolveExerciseId(ex.nome, userId);
    await prisma.routineSet.create({
      data: {
        routineId,
        exerciseId,
        order,
        sets: ex.series,
        reps: String(ex.reps),
        restSeconds: ex.descanso,
        notes: `IA - ${workout.nome}`,
      },
    });
    order++;
  }
  return order;
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SaveWorkoutBody = await request.json();
    const { nome, exercicios, treinos, routineId, replace } = body;

    // Validate: need either exercicios (single) or treinos (weekly)
    const workouts: SingleWorkout[] = treinos?.length
      ? treinos
      : exercicios?.length
        ? [{ nome, exercicios }]
        : [];

    if (workouts.length === 0) {
      return NextResponse.json(
        { error: 'Exercícios são obrigatórios' },
        { status: 400 }
      );
    }

    let routine;

    if (routineId) {
      // Use existing routine
      routine = await prisma.routine.findUnique({ where: { id: routineId } });
      if (!routine || routine.userId !== user.id) {
        return NextResponse.json({ error: 'Rotina não encontrada' }, { status: 404 });
      }

      if (replace) {
        // Delete ALL existing sets before adding new ones
        await prisma.routineSet.deleteMany({ where: { routineId } });
      }

      // Get current max order
      const existingSetsCount = replace
        ? 0
        : await prisma.routineSet.count({ where: { routineId } });

      let order = existingSetsCount + 1;
      for (const w of workouts) {
        order = await createSetsForWorkout(routineId, w, order, user.id);
      }
    } else {
      // Create new routine
      await prisma.routine.updateMany({
        where: { userId: user.id, isActive: true },
        data: { isActive: false },
      });

      routine = await prisma.routine.create({
        data: {
          name: nome || 'Rotina IA',
          description: workouts.length > 1
            ? `${workouts.length} treinos gerados pela GymFire AI`
            : 'Treino gerado pela GymFire AI',
          isActive: true,
          userId: user.id,
        },
      });

      let order = 1;
      for (const w of workouts) {
        order = await createSetsForWorkout(routine.id, w, order, user.id);
      }
    }

    const fullRoutine = await prisma.routine.findUnique({
      where: { id: routine!.id },
      include: {
        sets: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(fullRoutine, { status: 201 });
  } catch (error) {
    console.error('Save AI workout error:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar treino' },
      { status: 500 }
    );
  }
}
