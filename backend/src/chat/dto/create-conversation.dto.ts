import { IsArray, IsString, IsOptional, IsEnum, ArrayMinSize } from 'class-validator';

export class CreateConversationDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  participantIds: string[];

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['DIRECT', 'GROUP'])
  type?: 'DIRECT' | 'GROUP' = 'DIRECT';
}
