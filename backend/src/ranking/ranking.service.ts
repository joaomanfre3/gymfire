import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RankingService {
  constructor(private readonly prisma: PrismaService) {}

  async getWeeklyRanking(limit = 50) {
    // Get start of current ISO week (Monday)
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyPoints = await this.prisma.pointTransaction.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: startOfWeek },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    });

    const userIds = weeklyPoints.map((wp) => wp.userId);

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        currentStreak: true,
      },
    });

    const usersMap = new Map(users.map((u) => [u.id, u]));

    return weeklyPoints.map((wp, index) => ({
      position: index + 1,
      points: wp._sum.amount ?? 0,
      user: usersMap.get(wp.userId),
    }));
  }

  async getAllTimeRanking(limit = 50) {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        currentStreak: true,
        totalPoints: true,
      },
      orderBy: { totalPoints: 'desc' },
      take: limit,
    });

    return users.map((user, index) => ({
      position: index + 1,
      points: user.totalPoints,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        currentStreak: user.currentStreak,
      },
    }));
  }
}
