import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class AddSetDto {
  @IsString()
  exerciseId: string;

  @IsOptional()
  @IsInt()
  reps?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsInt()
  duration?: number;

  @IsOptional()
  @IsNumber()
  distance?: number;

  @IsOptional()
  @IsInt()
  rpe?: number;

  @IsOptional()
  @IsBoolean()
  isWarmup?: boolean;

  @IsOptional()
  @IsBoolean()
  isDropset?: boolean;

  @IsOptional()
  @IsBoolean()
  isFailure?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
