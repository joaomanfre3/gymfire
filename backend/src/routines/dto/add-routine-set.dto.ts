import { IsString, IsInt, IsOptional, IsNumber } from 'class-validator';

export class AddRoutineSetDto {
  @IsString()
  exerciseId: string;

  @IsInt()
  order: number;

  @IsInt()
  sets: number;

  @IsString()
  reps: string;

  @IsOptional()
  @IsInt()
  restSeconds?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  weightHint?: number;

  @IsOptional()
  @IsInt()
  rpe?: number;
}
