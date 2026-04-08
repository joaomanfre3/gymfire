import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

interface WorkoutExercise {
  nome: string;
  series: number;
  reps: number;
  descanso: number;
}

interface SaveWorkoutBody {
  nome: string;
  exercicios: WorkoutExercise[];
  routineId?: string; // if provided, adds workout to existing routine
  replaceWorkoutId?: string; // if provided, replaces this workout in the routine
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SaveWorkoutBody = await request.json();
    const { nome, exercicios, routineId, replaceWorkoutId } = body;

    if (!nome || !exercicios?.length) {
      return NextResponse.json(
        { error: 'Nome e exercícios são obrigatórios' },
        { status: 400 }
      );
    }

    // For each exercise, find or create it
    const exerciseIds: string[] = [];
    for (const ex of exercicios) {
      const slug = ex.nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Try to find existing exercise by name (case insensitive)
      let exercise = await prisma.exercise.findFirst({
        where: {
          OR: [
            { name: { equals: ex.nome, mode: 'insensitive' } },
            { slug: slug },
          ],
        },
      });

      if (!exercise) {
        // Ensure slug uniqueness
        let uniqueSlug = slug;
        let counter = 1;
        while (await prisma.exercise.findUnique({ where: { slug: uniqueSlug } })) {
          uniqueSlug = `${slug}-${counter}`;
          counter++;
        }

        exercise = await prisma.exercise.create({
          data: {
            name: ex.nome,
            slug: uniqueSlug,
            muscleGroup: 'OTHER',
            equipment: 'OTHER',
            category: 'STRENGTH',
            isPublic: true,
            isFromLibrary: false,
            createdById: user.id,
          },
        });
      }

      exerciseIds.push(exercise.id);
    }

    let routine;

    if (routineId) {
      // Add to existing routine
      routine = await prisma.routine.findUnique({ where: { id: routineId } });
      if (!routine || routine.userId !== user.id) {
        return NextResponse.json({ error: 'Rotina não encontrada' }, { status: 404 });
      }

      if (replaceWorkoutId) {
        // Replace existing workout in routine - delete old sets and add new ones
        await prisma.routineSet.deleteMany({
          where: { routineId, id: replaceWorkoutId },
        });
      }

      // Add exercises as routine sets
      const existingSetsCount = await prisma.routineSet.count({ where: { routineId } });

      for (let i = 0; i < exercicios.length; i++) {
        await prisma.routineSet.create({
          data: {
            routineId,
            exerciseId: exerciseIds[i],
            order: existingSetsCount + i + 1,
            sets: exercicios[i].series,
            reps: String(exercicios[i].reps),
            restSeconds: exercicios[i].descanso,
            notes: `Gerado por IA - ${nome}`,
          },
        });
      }
    } else {
      // Create new routine
      // Deactivate all other routines
      await prisma.routine.updateMany({
        where: { userId: user.id, isActive: true },
        data: { isActive: false },
      });

      routine = await prisma.routine.create({
        data: {
          name: nome,
          description: `Treino gerado pela GymFire AI`,
          isActive: true,
          userId: user.id,
        },
      });

      // Add exercises as routine sets
      for (let i = 0; i < exercicios.length; i++) {
        await prisma.routineSet.create({
          data: {
            routineId: routine.id,
            exerciseId: exerciseIds[i],
            order: i + 1,
            sets: exercicios[i].series,
            reps: String(exercicios[i].reps),
            restSeconds: exercicios[i].descanso,
            notes: `Gerado por IA`,
          },
        });
      }
    }

    // Fetch the complete routine with sets
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
