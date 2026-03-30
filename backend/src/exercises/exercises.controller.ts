import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  MuscleGroup,
  Equipment,
  ExerciseCategory,
} from '@prisma/client';

@Controller('exercises')
@UseGuards(JwtAuthGuard)
export class ExercisesController {
  constructor(private exercisesService: ExercisesService) {}

  @Get()
  findAll(
    @Query('muscleGroup') muscleGroup?: MuscleGroup,
    @Query('equipment') equipment?: Equipment,
    @Query('category') category?: ExerciseCategory,
  ) {
    return this.exercisesService.findAll({ muscleGroup, equipment, category });
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.exercisesService.findById(id);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateExerciseDto) {
    return this.exercisesService.create(req.user.userId, dto);
  }
}
