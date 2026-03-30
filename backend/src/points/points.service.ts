import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointType } from '@prisma/client';

@Injectable()
export class PointsService {
  constructor(private readonly prisma: PrismaService) {}

  async addPoints(
    userId: string,
    amount: number,
    type: PointType,
    description?: string,
    refId?: string,
  ) {
    const [transaction] = await this.prisma.$transaction([
      this.prisma.pointTransaction.create({
        data: {
          userId,
          amount,
          type,
          description,
          refId,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          totalPoints: { increment: amount },
        },
      }),
    ]);

    return transaction;
  }

  async getHistory(userId: string, skip = 0, limit = 20) {
    return this.prisma.pointTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  getStreakMultiplier(currentStreak: number): number {
    if (currentStreak >= 90) return 3.0;
    if (currentStreak >= 30) return 2.0;
    if (currentStreak >= 14) return 1.5;
    if (currentStreak >= 7) return 1.25;
    return 1.0;
  }
}
