import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpeedDto } from './dto/create-speed.dto';
import { MediaType } from '@prisma/client';

@Injectable()
export class SpeedsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSpeedDto) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return this.prisma.speed.create({
      data: {
        userId,
        mediaUrl: dto.mediaUrl,
        mediaType: (dto.mediaType as MediaType) ?? MediaType.IMAGE,
        caption: dto.caption,
        duration: dto.duration ?? 5000,
        workoutRef: dto.workoutRef,
        exerciseRef: dto.exerciseRef,
        expiresAt,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async getFeed(userId: string) {
    // Get IDs of users the current user follows
    const follows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = follows.map((f) => f.followingId);
    // Include own speeds in feed
    followingIds.push(userId);

    const now = new Date();

    // Get active speeds from followed users, grouped by user
    const speeds = await this.prisma.speed.findMany({
      where: {
        userId: { in: followingIds },
        expiresAt: { gt: now },
        isArchived: false,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        views: {
          where: { userId },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by user, order users by their latest speed
    const userMap = new Map<
      string,
      {
        user: (typeof speeds)[0]['user'];
        speeds: typeof speeds;
        latestAt: Date;
      }
    >();

    for (const speed of speeds) {
      const uid = speed.userId;
      if (!userMap.has(uid)) {
        userMap.set(uid, {
          user: speed.user,
          speeds: [],
          latestAt: speed.createdAt,
        });
      }
      const entry = userMap.get(uid)!;
      entry.speeds.push(speed);
      if (speed.createdAt > entry.latestAt) {
        entry.latestAt = speed.createdAt;
      }
    }

    // Sort users by latest speed (most recent first)
    const grouped = Array.from(userMap.values()).sort(
      (a, b) => b.latestAt.getTime() - a.latestAt.getTime(),
    );

    return grouped.map((g) => ({
      user: g.user,
      speeds: g.speeds.map((s) => ({
        ...s,
        isViewed: s.views.length > 0,
        views: undefined,
      })),
    }));
  }

  async getUserSpeeds(userId: string) {
    const now = new Date();

    return this.prisma.speed.findMany({
      where: {
        userId,
        expiresAt: { gt: now },
        isArchived: false,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async viewSpeed(speedId: string, viewerId: string) {
    const speed = await this.prisma.speed.findUnique({
      where: { id: speedId },
    });

    if (!speed) throw new NotFoundException('Speed not found');

    // Upsert the view
    await this.prisma.speedView.upsert({
      where: {
        speedId_userId: { speedId, userId: viewerId },
      },
      create: {
        speedId,
        userId: viewerId,
      },
      update: {
        viewedAt: new Date(),
      },
    });

    // Increment views count
    await this.prisma.speed.update({
      where: { id: speedId },
      data: { viewsCount: { increment: 1 } },
    });

    return { viewed: true };
  }

  async deleteSpeed(speedId: string, userId: string) {
    const speed = await this.prisma.speed.findUnique({
      where: { id: speedId },
    });

    if (!speed) throw new NotFoundException('Speed not found');
    if (speed.userId !== userId)
      throw new ForbiddenException('Cannot delete another user\'s speed');

    await this.prisma.speed.delete({ where: { id: speedId } });

    return { deleted: true };
  }

  async createHighlight(userId: string, title: string, coverUrl?: string) {
    return this.prisma.highlight.create({
      data: {
        userId,
        title,
        coverUrl,
      },
    });
  }

  async addSpeedToHighlight(
    highlightId: string,
    speedId: string,
    userId: string,
  ) {
    const highlight = await this.prisma.highlight.findUnique({
      where: { id: highlightId },
    });

    if (!highlight) throw new NotFoundException('Highlight not found');
    if (highlight.userId !== userId)
      throw new ForbiddenException('Cannot modify another user\'s highlight');

    const speed = await this.prisma.speed.findUnique({
      where: { id: speedId },
    });

    if (!speed) throw new NotFoundException('Speed not found');
    if (speed.userId !== userId)
      throw new ForbiddenException('Cannot add another user\'s speed');

    return this.prisma.speed.update({
      where: { id: speedId },
      data: {
        highlightId,
        isArchived: true,
      },
    });
  }

  async getUserHighlights(userId: string) {
    return this.prisma.highlight.findMany({
      where: { userId },
      include: {
        speeds: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { order: 'asc' },
    });
  }
}
