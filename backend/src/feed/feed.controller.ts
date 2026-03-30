import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeedService } from './feed.service';

@UseGuards(JwtAuthGuard)
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  getFeed(
    @Request() req: any,
    @Query('skip') skip?: string,
    @Query('limit') limit?: string,
  ) {
    return this.feedService.getFeed(
      req.user.id,
      skip ? parseInt(skip, 10) : 0,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  getPost(@Request() req: any, @Param('id') id: string) {
    return this.feedService.getPost(req.user.id, id);
  }
}
