import { IsString, MinLength, Matches } from 'class-validator';

export class PasswordResetCompleteDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(12)
  @Matches(/(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/)
  newPassword!: string;
}
