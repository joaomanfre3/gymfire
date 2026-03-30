import {
  IsString,
  IsOptional,
  IsEnum,
  IsUrl,
  IsArray,
  MinLength,
} from 'class-validator';
import {
  MuscleGroup,
  Equipment,
  ExerciseCategory,
  Difficulty,
} from '@prisma/client';

export class CreateExerciseDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEnum(MuscleGroup)
  muscleGroup: MuscleGroup;

  @IsEnum(Equipment)
  equipment: Equipment;

  @IsEnum(ExerciseCategory)
  category: ExerciseCategory;

  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  instructions?: string[];

  @IsOptional()
  @IsUrl()
  videoUrl?: string;
}
