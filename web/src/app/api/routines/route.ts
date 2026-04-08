import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const routines = await prisma.routine.findMany({
      where: { userId: user.id },
      include: {
        sets: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
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
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(routines);
  } catch (error) {
    console.error('Routines list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Routine name is required' },
        { status: 400 }
      );
    }

    // Deactivate all other routines for this user
    await prisma.routine.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    });

    const routine = await prisma.routine.create({
      data: {
        name,
        description: description || null,
        isActive: true,
        userId: user.id,
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

    return NextResponse.json(routine, { status: 201 });
  } catch (error) {
    console.error('Routine create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
