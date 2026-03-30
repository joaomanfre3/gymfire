import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Mood } from '@prisma/client';

export class FinishWorkoutDto {
  @IsOptional()
  @IsEnum(Mood)
  mood?: Mood;

  @IsOptional()
  @IsString()
  notes?: string;
}
