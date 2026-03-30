import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StreakService } from './streak.service';

@UseGuards(JwtAuthGuard)
@Controller('streak')
export class StreakController {
  constructor(private readonly streakService: StreakService) {}

  @Get('status')
  getStatus(@Request() req: any) {
    return this.streakService.getStatus(req.user.id);
  }
}
