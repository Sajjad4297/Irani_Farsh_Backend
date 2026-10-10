import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyUserDto {
  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @IsOptional()
  sessionId?: string;
}
