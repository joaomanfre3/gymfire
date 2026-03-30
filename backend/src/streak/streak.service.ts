import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointsService } from '../points/points.service';

@Injectable()
export class StreakService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pointsService: PointsService,
  ) {}

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastWorkoutAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const multiplier = this.pointsService.getStreakMultiplier(user.currentStreak);
    const nextMilestone = this.getNextMilestone(user.currentStreak);

    return {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastWorkoutAt: user.lastWorkoutAt,
      nextMilestone,
      multiplier,
    };
  }

  async extendStreak(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, longestStreak: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const newStreak = user.currentStreak + 1;
    const newLongest = Math.max(newStreak, user.longestStreak);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastWorkoutAt: new Date(),
        },
      }),
      this.prisma.streakLog.upsert({
        where: {
          userId_date: { userId, date: today },
        },
        update: { streakDay: newStreak },
        create: {
          userId,
          date: today,
          streakDay: newStreak,
        },
      }),
    ]);

    return { currentStreak: newStreak, longestStreak: newLongest };
  }

  async checkAndBreakStreak(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lastWorkoutAt: true, currentStreak: true },
    });

    if (!user) throw new NotFoundException('User not found');

    if (user.lastWorkoutAt) {
      const hoursSinceLastWorkout =
        (Date.now() - user.lastWorkoutAt.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastWorkout > 36 && user.currentStreak > 0) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { currentStreak: 0 },
        });
        return { broken: true, previousStreak: user.currentStreak };
      }
    }

    return { broken: false, currentStreak: user.currentStreak };
  }

  private getNextMilestone(currentStreak: number): number {
    const milestones = [7, 14, 30, 60, 90, 180, 365];
    return milestones.find((m) => m > currentStreak) ?? currentStreak + 30;
  }
}
