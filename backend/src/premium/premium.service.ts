import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const FREE_LIMITS: Record<string, number> = {
  routines: 3,
  folders: 2,
};

@Injectable()
export class PremiumService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isPremium: true, createdAt: true },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      isPremium: user.isPremium,
      plan: user.isPremium ? 'PREMIUM' : 'FREE',
      features: user.isPremium
        ? {
            routines: 'unlimited',
            folders: 'unlimited',
            streakFreeze: true,
            pointsBonus: 1.2,
            ads: false,
            export: true,
          }
        : {
            routines: FREE_LIMITS.routines,
            folders: FREE_LIMITS.folders,
            streakFreeze: false,
            pointsBonus: 1.0,
            ads: true,
            export: false,
          },
    };
  }

  async activate(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isPremium: true },
      select: { id: true, isPremium: true },
    });

    return { success: true, isPremium: user.isPremium };
  }

  async deactivate(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isPremium: false },
      select: { id: true, isPremium: true },
    });

    return { success: true, isPremium: user.isPremium };
  }

  async checkLimit(userId: string, feature: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true },
    });

    if (!user) throw new NotFoundException('User not found');

    // Premium users have no limits
    if (user.isPremium) {
      return { allowed: true, current: 0, limit: null, isPremium: true };
    }

    const limit = FREE_LIMITS[feature];
    if (limit === undefined) {
      return { allowed: true, current: 0, limit: null, isPremium: false };
    }

    let current = 0;

    if (feature === 'routines') {
      current = await this.prisma.routine.count({ where: { userId } });
    } else if (feature === 'folders') {
      current = await this.prisma.folder.count({ where: { userId } });
    }

    return {
      allowed: current < limit,
      current,
      limit,
      isPremium: false,
    };
  }

  async getLimits(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true },
    });

    if (!user) throw new NotFoundException('User not found');

    if (user.isPremium) {
      return {
        isPremium: true,
        limits: Object.keys(FREE_LIMITS).map((feature) => ({
          feature,
          current: 0,
          limit: null,
          allowed: true,
        })),
      };
    }

    const routineCount = await this.prisma.routine.count({ where: { userId } });
    const folderCount = await this.prisma.folder.count({ where: { userId } });

    return {
      isPremium: false,
      limits: [
        {
          feature: 'routines',
          current: routineCount,
          limit: FREE_LIMITS.routines,
          allowed: routineCount < FREE_LIMITS.routines,
        },
        {
          feature: 'folders',
          current: folderCount,
          limit: FREE_LIMITS.folders,
          allowed: folderCount < FREE_LIMITS.folders,
        },
      ],
    };
  }
}
