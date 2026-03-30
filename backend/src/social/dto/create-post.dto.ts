import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { PostType, Visibility } from '@prisma/client';

export class CreatePostDto {
  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];

  @IsOptional()
  @IsEnum(PostType)
  type?: PostType;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;
}
