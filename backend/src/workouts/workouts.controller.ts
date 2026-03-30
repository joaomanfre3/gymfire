import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkoutsService } from './workouts.service';
import { StartWorkoutDto } from './dto/start-workout.dto';
import { AddSetDto } from './dto/add-set.dto';
import { FinishWorkoutDto } from './dto/finish-workout.dto';

@UseGuards(JwtAuthGuard)
@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Post('start')
  start(@Request() req: any, @Body() dto: StartWorkoutDto) {
    return this.workoutsService.startWorkout(req.user.id, dto);
  }

  @Post(':id/sets')
  addSet(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: AddSetDto,
  ) {
    return this.workoutsService.addSet(req.user.id, id, dto);
  }

  @Post(':id/finish')
  finish(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: FinishWorkoutDto,
  ) {
    return this.workoutsService.finishWorkout(req.user.id, id, dto);
  }

  @Get(':id')
  getById(@Request() req: any, @Param('id') id: string) {
    return this.workoutsService.getById(req.user.id, id);
  }

  @Get()
  getHistory(
    @Request() req: any,
    @Query('skip') skip?: string,
    @Query('limit') limit?: string,
  ) {
    return this.workoutsService.getHistory(
      req.user.id,
      skip ? parseInt(skip, 10) : 0,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('routine/:routineId')
  getByRoutine(
    @Param('routineId') routineId: string,
    @Query('limit') limit?: string,
  ) {
    return this.workoutsService.getByRoutine(
      routineId,
      limit ? parseInt(limit, 10) : 10,
    );
  }
}
