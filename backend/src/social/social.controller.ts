import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SocialService } from './social.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@UseGuards(JwtAuthGuard)
@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('follow/:userId')
  follow(@Request() req: any, @Param('userId') userId: string) {
    return this.socialService.followUser(req.user.id, userId);
  }

  @Delete('follow/:userId')
  unfollow(@Request() req: any, @Param('userId') userId: string) {
    return this.socialService.unfollowUser(req.user.id, userId);
  }

  @Get('followers/:userId')
  getFollowers(
    @Param('userId') userId: string,
    @Query('skip') skip?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialService.getFollowers(
      userId,
      skip ? parseInt(skip, 10) : 0,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('following/:userId')
  getFollowing(
    @Param('userId') userId: string,
    @Query('skip') skip?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialService.getFollowing(
      userId,
      skip ? parseInt(skip, 10) : 0,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('posts')
  createPost(
    @Request() req: any,
    @Body() dto: CreatePostDto & { workoutId?: string },
  ) {
    const { workoutId, ...postDto } = dto;
    return this.socialService.createPost(req.user.id, postDto, workoutId);
  }

  @Post('posts/:id/like')
  likePost(@Request() req: any, @Param('id') id: string) {
    return this.socialService.likePost(req.user.id, id);
  }

  @Delete('posts/:id/like')
  unlikePost(@Request() req: any, @Param('id') id: string) {
    return this.socialService.unlikePost(req.user.id, id);
  }

  @Post('posts/:id/fire')
  fireReact(@Request() req: any, @Param('id') id: string) {
    return this.socialService.fireReact(req.user.id, id);
  }

  @Delete('posts/:id/fire')
  unfireReact(@Request() req: any, @Param('id') id: string) {
    return this.socialService.unfireReact(req.user.id, id);
  }

  @Post('posts/:id/comments')
  addComment(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto & { parentId?: string },
  ) {
    const { parentId, ...commentDto } = dto;
    return this.socialService.addComment(req.user.id, id, commentDto, parentId);
  }

  @Delete('comments/:id')
  deleteComment(@Request() req: any, @Param('id') id: string) {
    return this.socialService.deleteComment(req.user.id, id);
  }
}
