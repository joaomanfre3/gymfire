import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminUser, adminUnauthorized } from '@/lib/admin';
import { exerciseLibrary } from '@/lib/exercises-library';

export async function POST(request: Request) {
  const admin = await getAdminUser(request);
  if (!admin) return adminUnauthorized();

  let imported = 0;
  let skipped = 0;

  for (const ex of exerciseLibrary) {
    try {
      await prisma.exercise.upsert({
        where: { slug: ex.slug },
        update: {
          name: ex.name,
          muscleGroup: ex.muscleGroup as never,
          equipment: ex.equipment as never,
          category: ex.category as never,
          difficulty: ex.difficulty as never,
          instructions: ex.instructions,
          secondaryMuscles: (ex.secondaryMuscles || []) as never[],
          isPublic: true,
          isFromLibrary: true,
          externalSource: 'gymfire-library',
        },
        create: {
          name: ex.name,
          slug: ex.slug,
          muscleGroup: ex.muscleGroup as never,
          equipment: ex.equipment as never,
          category: ex.category as never,
          difficulty: ex.difficulty as never,
          instructions: ex.instructions,
          secondaryMuscles: (ex.secondaryMuscles || []) as never[],
          isPublic: true,
          isFromLibrary: true,
          externalSource: 'gymfire-library',
        },
      });
      imported++;
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({
    message: `Importação concluída: ${imported} exercícios importados, ${skipped} ignorados.`,
    imported,
    skipped,
    total: exerciseLibrary.length,
  });
}

export async function GET(request: Request) {
  const admin = await getAdminUser(request);
  if (!admin) return adminUnauthorized();

  const totalLibrary = exerciseLibrary.length;
  const totalInDb = await prisma.exercise.count();
  const fromLibrary = await prisma.exercise.count({ where: { isFromLibrary: true } });

  return NextResponse.json({
    totalLibrary,
    totalInDb,
    fromLibrary,
    pending: totalLibrary - fromLibrary,
  });
}
