import { IsEmail, IsEnum, IsOptional, IsString, MinLength, Matches } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsEmail() email!: string;
  @IsString() firstName!: string;
  @IsString() lastName!: string;
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() gmcNumber?: string;
  @IsEnum(Role) role!: Role;
  @IsString() @MinLength(12) @Matches(/(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/) temporaryPassword!: string;
}
