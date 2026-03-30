import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeed(userId: string, skip = 0, limit = 20) {
    // Get list of users the current user follows
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    const feedUserIds = [userId, ...followingIds];

    const posts = await this.prisma.post.findMany({
      where: {
        userId: { in: feedUserIds },
        OR: [
          { visibility: 'PUBLIC' },
          { visibility: 'FOLLOWERS', userId: { in: followingIds } },
          { userId },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            currentStreak: true,
          },
        },
        workout: {
          include: {
            sets: {
              include: { exercise: true },
              orderBy: { completedAt: 'asc' },
            },
          },
        },
        likes: {
          where: { userId },
          select: { id: true },
        },
        fireReactions: {
          where: { userId },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return posts.map((post) => {
      const { likes, fireReactions, ...rest } = post;
      return {
        ...rest,
        hasLiked: likes.length > 0,
        hasFired: fireReactions.length > 0,
      };
    });
  }

  async getPost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            currentStreak: true,
          },
        },
        workout: {
          include: {
            sets: {
              include: { exercise: true },
              orderBy: { completedAt: 'asc' },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            replies: {
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
          where: { parentId: null },
          orderBy: { createdAt: 'asc' },
        },
        likes: {
          where: { userId },
          select: { id: true },
        },
        fireReactions: {
          where: { userId },
          select: { id: true },
        },
      },
    });

    if (!post) throw new NotFoundException('Post not found');

    const { likes, fireReactions, ...rest } = post;
    return {
      ...rest,
      hasLiked: likes.length > 0,
      hasFired: fireReactions.length > 0,
    };
  }
}
