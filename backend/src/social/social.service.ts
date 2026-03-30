import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PostType, Visibility } from '@prisma/client';

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    // Check if blocked
    const blocked = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: followingId, blockedId: followerId },
          { blockerId: followerId, blockedId: followingId },
        ],
      },
    });

    if (blocked) {
      throw new ForbiddenException('Cannot follow this user');
    }

    try {
      return await this.prisma.follow.create({
        data: { followerId, followingId },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Already following this user');
      }
      throw error;
    }
  }

  async unfollowUser(followerId: string, followingId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (!follow) throw new NotFoundException('Follow not found');

    return this.prisma.follow.delete({ where: { id: follow.id } });
  }

  async getFollowers(userId: string, skip = 0, limit = 20) {
    return this.prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            currentStreak: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  async getFollowing(userId: string, skip = 0, limit = 20) {
    return this.prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            currentStreak: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  async createPost(userId: string, dto: CreatePostDto, workoutId?: string) {
    return this.prisma.post.create({
      data: {
        userId,
        caption: dto.caption,
        mediaUrls: dto.mediaUrls ?? [],
        type: dto.type ?? PostType.WORKOUT,
        visibility: dto.visibility ?? Visibility.PUBLIC,
        workoutId,
      },
    });
  }

  async likePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundException('Post not found');

    try {
      await this.prisma.$transaction([
        this.prisma.like.create({
          data: { userId, postId },
        }),
        this.prisma.post.update({
          where: { id: postId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Already liked');
      }
      throw error;
    }

    return { liked: true };
  }

  async unlikePost(userId: string, postId: string) {
    const like = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (!like) throw new NotFoundException('Like not found');

    await this.prisma.$transaction([
      this.prisma.like.delete({ where: { id: like.id } }),
      this.prisma.post.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      }),
    ]);

    return { liked: false };
  }

  async fireReact(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundException('Post not found');

    try {
      await this.prisma.fireReaction.create({
        data: { userId, postId },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Already reacted with fire');
      }
      throw error;
    }

    return { fired: true };
  }

  async unfireReact(userId: string, postId: string) {
    const reaction = await this.prisma.fireReaction.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (!reaction) throw new NotFoundException('Fire reaction not found');

    await this.prisma.fireReaction.delete({ where: { id: reaction.id } });

    return { fired: false };
  }

  async addComment(
    userId: string,
    postId: string,
    dto: CreateCommentDto,
    parentId?: string,
  ) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundException('Post not found');

    if (parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parent || parent.postId !== postId) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const [comment] = await this.prisma.$transaction([
      this.prisma.comment.create({
        data: {
          userId,
          postId,
          content: dto.content,
          parentId,
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
      }),
      this.prisma.post.update({
        where: { id: postId },
        data: { commentsCount: { increment: 1 } },
      }),
    ]);

    return comment;
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) throw new ForbiddenException();

    await this.prisma.$transaction([
      this.prisma.comment.delete({ where: { id: commentId } }),
      this.prisma.post.update({
        where: { id: comment.postId },
        data: { commentsCount: { decrement: 1 } },
      }),
    ]);

    return { deleted: true };
  }
}
