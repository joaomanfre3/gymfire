import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PremiumService } from './premium.service';

@UseGuards(JwtAuthGuard)
@Controller('premium')
export class PremiumController {
  constructor(private readonly premiumService: PremiumService) {}

  @Get('status')
  getStatus(@Request() req: any) {
    return this.premiumService.getStatus(req.user.id);
  }

  @Post('activate')
  activate(@Request() req: any) {
    return this.premiumService.activate(req.user.id);
  }

  @Get('limits')
  getLimits(@Request() req: any) {
    return this.premiumService.getLimits(req.user.id);
  }
}
