import { IsString, IsOptional, IsBoolean, IsNumber, IsInt, Min } from 'class-validator';

export class PatchLesionDto {
  @IsString() @IsOptional() segment?: string;
  @IsString() @IsOptional() laterality?: string;
  @IsBoolean() @IsOptional() isTargetLesion?: boolean;
  @IsNumber() @IsOptional() diameterAxialMm?: number;
  @IsNumber() @IsOptional() diameterCraniocaudalMm?: number;
  @IsNumber() @IsOptional() diameterApMm?: number;
  @IsString() @IsOptional() lirads?: string;
  @IsString() @IsOptional() notes?: string;
  @IsInt() @Min(1) version!: number;
}
