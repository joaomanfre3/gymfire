import { IsString, IsOptional } from 'class-validator';

export class StartWorkoutDto {
  @IsOptional()
  @IsString()
  routineId?: string;

  @IsOptional()
  @IsString()
  title?: string;
}
