import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RankingService } from './ranking.service';

@UseGuards(JwtAuthGuard)
@Controller('ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('weekly')
  getWeekly(@Query('limit') limit?: string) {
    return this.rankingService.getWeeklyRanking(
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('all-time')
  getAllTime(@Query('limit') limit?: string) {
    return this.rankingService.getAllTimeRanking(
      limit ? parseInt(limit, 10) : 50,
    );
  }
}
