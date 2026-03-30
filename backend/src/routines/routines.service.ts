import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';
import { AddRoutineSetDto } from './dto/add-routine-set.dto';

@Injectable()
export class RoutinesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateRoutineDto) {
    return this.prisma.routine.create({
      data: {
        name: dto.name,
        description: dto.description,
        days: dto.days ?? [],
        isPublic: dto.isPublic ?? false,
        userId,
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.routine.findMany({
      where: { userId },
      include: {
        sets: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(routineId: string) {
    const routine = await this.prisma.routine.findUnique({
      where: { id: routineId },
      include: {
        sets: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!routine) throw new NotFoundException('Routine not found');
    return routine;
  }

  async update(routineId: string, userId: string, dto: UpdateRoutineDto) {
    const routine = await this.prisma.routine.findUnique({
      where: { id: routineId },
    });

    if (!routine) throw new NotFoundException('Routine not found');
    if (routine.userId !== userId) throw new ForbiddenException();

    return this.prisma.routine.update({
      where: { id: routineId },
      data: dto,
    });
  }

  async delete(routineId: string, userId: string) {
    const routine = await this.prisma.routine.findUnique({
      where: { id: routineId },
    });

    if (!routine) throw new NotFoundException('Routine not found');
    if (routine.userId !== userId) throw new ForbiddenException();

    return this.prisma.routine.delete({ where: { id: routineId } });
  }

  async addSet(routineId: string, userId: string, dto: AddRoutineSetDto) {
    const routine = await this.prisma.routine.findUnique({
      where: { id: routineId },
    });

    if (!routine) throw new NotFoundException('Routine not found');
    if (routine.userId !== userId) throw new ForbiddenException();

    return this.prisma.routineSet.create({
      data: {
        routineId,
        exerciseId: dto.exerciseId,
        order: dto.order,
        sets: dto.sets,
        reps: dto.reps,
        restSeconds: dto.restSeconds ?? 90,
        notes: dto.notes,
        weightHint: dto.weightHint,
        rpe: dto.rpe,
      },
      include: { exercise: true },
    });
  }

  async removeSet(routineId: string, userId: string, setId: string) {
    const routine = await this.prisma.routine.findUnique({
      where: { id: routineId },
    });

    if (!routine) throw new NotFoundException('Routine not found');
    if (routine.userId !== userId) throw new ForbiddenException();

    const set = await this.prisma.routineSet.findUnique({
      where: { id: setId },
    });

    if (!set || set.routineId !== routineId) {
      throw new NotFoundException('Set not found');
    }

    return this.prisma.routineSet.delete({ where: { id: setId } });
  }
}
