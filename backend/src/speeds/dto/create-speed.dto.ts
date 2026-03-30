import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';

export class CreateSpeedDto {
  @IsString()
  mediaUrl: string;

  @IsOptional()
  @IsEnum(['IMAGE', 'VIDEO', 'BOOMERANG'])
  mediaType?: 'IMAGE' | 'VIDEO' | 'BOOMERANG';

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  workoutRef?: string;

  @IsOptional()
  @IsString()
  exerciseRef?: string;
}
