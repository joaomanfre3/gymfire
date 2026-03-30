import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SpeedsService } from './speeds.service';
import { CreateSpeedDto } from './dto/create-speed.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class SpeedsController {
  constructor(private readonly speedsService: SpeedsService) {}

  // ── Speeds ─────────────────────────────────────────────────

  @Post('speeds')
  create(@Request() req: any, @Body() dto: CreateSpeedDto) {
    return this.speedsService.create(req.user.id, dto);
  }

  @Get('speeds/feed')
  getFeed(@Request() req: any) {
    return this.speedsService.getFeed(req.user.id);
  }

  @Get('speeds/user/:userId')
  getUserSpeeds(@Param('userId') userId: string) {
    return this.speedsService.getUserSpeeds(userId);
  }

  @Post('speeds/:id/view')
  viewSpeed(@Request() req: any, @Param('id') id: string) {
    return this.speedsService.viewSpeed(id, req.user.id);
  }

  @Delete('speeds/:id')
  deleteSpeed(@Request() req: any, @Param('id') id: string) {
    return this.speedsService.deleteSpeed(id, req.user.id);
  }

  // ── Highlights ─────────────────────────────────────────────

  @Post('highlights')
  createHighlight(
    @Request() req: any,
    @Body() body: { title: string; coverUrl?: string },
  ) {
    return this.speedsService.createHighlight(
      req.user.id,
      body.title,
      body.coverUrl,
    );
  }

  @Post('highlights/:id/speeds')
  addSpeedToHighlight(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { speedId: string },
  ) {
    return this.speedsService.addSpeedToHighlight(id, body.speedId, req.user.id);
  }

  @Get('highlights/user/:userId')
  getUserHighlights(@Param('userId') userId: string) {
    return this.speedsService.getUserHighlights(userId);
  }
}
