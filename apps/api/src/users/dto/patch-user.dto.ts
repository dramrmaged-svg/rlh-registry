import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class PatchUserDto {
  @IsString() @IsOptional() firstName?: string;
  @IsString() @IsOptional() lastName?: string;
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() gmcNumber?: string;
  @IsInt() @Min(1) version!: number;
}
