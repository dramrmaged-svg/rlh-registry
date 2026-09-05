import { IsString, IsOptional, IsBoolean, IsInt, Min, IsNumber } from 'class-validator';

export class CreateLesionDto {
  @IsInt() @Min(1) @IsOptional() lesionNumber?: number;
  @IsString() @IsOptional() segment?: string;
  @IsString() @IsOptional() laterality?: string;
  @IsBoolean() @IsOptional() isTargetLesion?: boolean;
  @IsNumber() @IsOptional() diameterAxialMm?: number;
  @IsNumber() @IsOptional() diameterCraniocaudalMm?: number;
  @IsNumber() @IsOptional() diameterApMm?: number;
  @IsString() @IsOptional() lirads?: string;
  @IsString() @IsOptional() notes?: string;
}
