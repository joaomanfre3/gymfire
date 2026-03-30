import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointsService } from '../points/points.service';
import { StreakService } from '../streak/streak.service';
import { StartWorkoutDto } from './dto/start-workout.dto';
import { AddSetDto } from './dto/add-set.dto';
import { FinishWorkoutDto } from './dto/finish-workout.dto';
import { PointType } from '@prisma/client';

@Injectable()
export class WorkoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pointsService: PointsService,
    private readonly streakService: StreakService,
  ) {}

  async startWorkout(userId: string, dto: StartWorkoutDto) {
    return this.prisma.workout.create({
      data: {
        userId,
        routineId: dto.routineId,
        title: dto.title,
        startedAt: new Date(),
      },
    });
  }

  async addSet(userId: string, workoutId: string, dto: AddSetDto) {
    // 1. Verify workout belongs to user and not finished
    const workout = await this.prisma.workout.findUnique({
      where: { id: workoutId },
    });

    if (!workout) throw new NotFoundException('Workout not found');
    if (workout.userId !== userId) throw new ForbiddenException();
    if (workout.finishedAt) {
      throw new BadRequestException('Workout is already finished');
    }

    // 2. Calculate setNumber
    const existingSetsCount = await this.prisma.workoutSet.count({
      where: { workoutId, exerciseId: dto.exerciseId },
    });
    const setNumber = existingSetsCount + 1;

    // 3. Check for weight PR
    let isPR = false;
    const prRecords: Array<{ type: 'MAX_WEIGHT' | 'MAX_REPS'; value: number; previousValue: number | null }> = [];

    if (dto.weight != null && dto.weight > 0) {
      const maxWeightRecord = await this.prisma.workoutSet.aggregate({
        where: {
          workout: { userId },
          exerciseId: dto.exerciseId,
        },
        _max: { weight: true },
      });

      const currentMaxWeight = maxWeightRecord._max.weight ?? 0;

      if (dto.weight > currentMaxWeight) {
        isPR = true;
        prRecords.push({
          type: 'MAX_WEIGHT',
          value: dto.weight,
          previousValue: currentMaxWeight > 0 ? currentMaxWeight : null,
        });
      }

      // 4. Check for max reps at same weight
      if (dto.reps != null && dto.reps > 0) {
        const maxRepsAtWeight = await this.prisma.workoutSet.aggregate({
          where: {
            workout: { userId },
            exerciseId: dto.exerciseId,
            weight: dto.weight,
          },
          _max: { reps: true },
        });

        const currentMaxReps = maxRepsAtWeight._max.reps ?? 0;

        if (dto.reps > currentMaxReps) {
          isPR = true;
          prRecords.push({
            type: 'MAX_REPS',
            value: dto.reps,
            previousValue: currentMaxReps > 0 ? currentMaxReps : null,
          });
        }
      }
    }

    // 5 & 6. Create set and PR entries in a transaction
    const workoutSet = await this.prisma.$transaction(async (tx) => {
      const set = await tx.workoutSet.create({
        data: {
          workoutId,
          exerciseId: dto.exerciseId,
          setNumber,
          reps: dto.reps,
          weight: dto.weight,
          duration: dto.duration,
          distance: dto.distance,
          rpe: dto.rpe,
          isWarmup: dto.isWarmup ?? false,
          isDropset: dto.isDropset ?? false,
          isFailure: dto.isFailure ?? false,
          isPR: isPR,
          notes: dto.notes,
        },
        include: { exercise: true },
      });

      // Create PersonalRecord entries
      for (const pr of prRecords) {
        await tx.personalRecord.create({
          data: {
            userId,
            exerciseId: dto.exerciseId,
            workoutId,
            type: pr.type,
            value: pr.value,
            previousValue: pr.previousValue,
          },
        });
      }

      return set;
    });

    // 7. Return set with isPR flag
    return { ...workoutSet, isPR: isPR };
  }

  async finishWorkout(userId: string, workoutId: string, dto: FinishWorkoutDto) {
    // 1. Load workout with all sets
    const workout = await this.prisma.workout.findUnique({
      where: { id: workoutId },
      include: { sets: true },
    });

    if (!workout) throw new NotFoundException('Workout not found');
    if (workout.userId !== userId) throw new ForbiddenException();
    if (workout.finishedAt) {
      throw new BadRequestException('Workout is already finished');
    }

    const now = new Date();

    // 2. Calculate totals
    let totalVolume = 0;
    let totalReps = 0;
    const totalSets = workout.sets.length;

    for (const set of workout.sets) {
      const weight = set.weight ?? 0;
      const reps = set.reps ?? 0;
      totalVolume += weight * reps;
      totalReps += reps;
    }

    // 3. Calculate duration
    const durationSecs = Math.floor(
      (now.getTime() - workout.startedAt.getTime()) / 1000,
    );

    // 4. Calculate points
    const prCount = workout.sets.filter((s) => s.isPR).length;
    const basePoints = 100; // WORKOUT_COMPLETE
    const prPoints = prCount * 250;
    const volumeBonus = Math.floor(totalVolume / 100);
    let totalPoints = basePoints + prPoints + volumeBonus;

    // 5. Get streak multiplier
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true },
    });

    const multiplier = this.pointsService.getStreakMultiplier(
      user?.currentStreak ?? 0,
    );

    // 6. Apply multiplier
    totalPoints = Math.floor(totalPoints * multiplier);

    // 7-8. Update user points and streak
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totalPoints: { increment: totalPoints },
        lastWorkoutAt: now,
      },
    });

    // Extend streak
    await this.streakService.extendStreak(userId);

    // 9. Create PointTransaction entries
    await this.pointsService.addPoints(
      userId,
      basePoints,
      PointType.WORKOUT_COMPLETE,
      'Workout completed',
      workoutId,
    );

    if (prCount > 0) {
      await this.pointsService.addPoints(
        userId,
        prPoints,
        PointType.PERSONAL_RECORD,
        `${prCount} personal record(s)`,
        workoutId,
      );
    }

    if (volumeBonus > 0) {
      await this.pointsService.addPoints(
        userId,
        volumeBonus,
        PointType.STREAK_BONUS,
        'Volume bonus',
        workoutId,
      );
    }

    // 11. Update workout with all calculated fields
    const finishedWorkout = await this.prisma.workout.update({
      where: { id: workoutId },
      data: {
        finishedAt: now,
        durationSecs,
        totalVolume,
        totalSets,
        totalReps,
        pointsEarned: totalPoints,
        mood: dto.mood,
        notes: dto.notes,
      },
      include: {
        sets: {
          include: { exercise: true },
          orderBy: { completedAt: 'asc' },
        },
        personalRecords: true,
      },
    });

    // 12. Return finished workout
    return finishedWorkout;
  }

  async getById(userId: string, workoutId: string) {
    const workout = await this.prisma.workout.findUnique({
      where: { id: workoutId },
      include: {
        sets: {
          include: { exercise: true },
          orderBy: { completedAt: 'asc' },
        },
        personalRecords: {
          include: { exercise: true },
        },
        routine: true,
      },
    });

    if (!workout) throw new NotFoundException('Workout not found');
    if (workout.userId !== userId) throw new ForbiddenException();

    return workout;
  }

  async getHistory(userId: string, skip = 0, limit = 20) {
    return this.prisma.workout.findMany({
      where: { userId, finishedAt: { not: null } },
      include: {
        sets: {
          include: { exercise: true },
          orderBy: { completedAt: 'asc' },
        },
        routine: true,
      },
      orderBy: { finishedAt: 'desc' },
      skip,
      take: limit,
    });
  }

  async getByRoutine(routineId: string, limit = 10) {
    return this.prisma.workout.findMany({
      where: { routineId, finishedAt: { not: null } },
      include: {
        sets: {
          include: { exercise: true },
          orderBy: { completedAt: 'asc' },
        },
      },
      orderBy: { finishedAt: 'desc' },
      take: limit,
    });
  }
}
