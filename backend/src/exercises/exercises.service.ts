import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import {
  MuscleGroup,
  Equipment,
  ExerciseCategory,
} from '@prisma/client';

@Injectable()
export class ExercisesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: {
    muscleGroup?: MuscleGroup;
    equipment?: Equipment;
    category?: ExerciseCategory;
  }) {
    return this.prisma.exercise.findMany({
      where: {
        ...(filters?.muscleGroup && { muscleGroup: filters.muscleGroup }),
        ...(filters?.equipment && { equipment: filters.equipment }),
        ...(filters?.category && { category: filters.category }),
        isPublic: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
      include: {
        aliases: true,
        muscles: true,
      },
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    return exercise;
  }

  async create(userId: string, dto: CreateExerciseDto) {
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Ensure slug uniqueness by appending a suffix if needed
    let uniqueSlug = slug;
    let counter = 1;
    while (await this.prisma.exercise.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    return this.prisma.exercise.create({
      data: {
        name: dto.name,
        slug: uniqueSlug,
        description: dto.description,
        instructions: dto.instructions ?? [],
        muscleGroup: dto.muscleGroup,
        equipment: dto.equipment,
        category: dto.category,
        difficulty: dto.difficulty,
        videoUrl: dto.videoUrl,
        isPublic: false,
        isFromLibrary: false,
        createdById: userId,
      },
    });
  }

  async seed() {
    return { message: 'Exercise seeding disabled - users add their own exercises' };
  }
}
