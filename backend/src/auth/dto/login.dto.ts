import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  username: string; // accepts username or email

  @IsString()
  password: string;
}
