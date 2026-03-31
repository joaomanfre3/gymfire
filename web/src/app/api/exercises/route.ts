import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);

    const { searchParams } = new URL(request.url);
    const muscleGroup = searchParams.get('muscleGroup');
    const equipment = searchParams.get('equipment');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (user) {
      where.OR = [{ isPublic: true }, { createdById: user.id }];
    } else {
      where.isPublic = true;
    }

    if (muscleGroup) {
      where.muscleGroup = muscleGroup;
    }

    if (equipment) {
      where.equipment = equipment;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { aliases: { some: { name: { contains: search, mode: 'insensitive' } } } },
          ],
        },
      ];
    }

    const exercises = await prisma.exercise.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        muscleGroup: true,
        equipment: true,
        difficulty: true,
        category: true,
        description: true,
      },
      orderBy: { name: 'asc' },
      take: 200,
    });

    return NextResponse.json(exercises);
  } catch (error) {
    console.error('Exercises list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
