import { IsString, IsOptional, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { WeekDay } from '@prisma/client';

export class CreateRoutineDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(WeekDay, { each: true })
  days?: WeekDay[];

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
