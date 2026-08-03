import { IsString, IsOptional, IsDateString, IsNumber, IsInt, Min, IsIn } from 'class-validator';

const LOCK_STATUSES = ['DRAFT', 'SUBMITTED', 'LOCKED'] as const;

export class PatchMappingSessionDto {
  @IsDateString() @IsOptional() sessionDate?: string;
  @IsString() @IsOptional() status?: string;
  @IsString() @IsOptional() accessRoute?: string;
  @IsString() @IsOptional() accessSite?: string;
  @IsString() @IsOptional() catheterType?: string;
  @IsNumber() @IsOptional() fluoroTimeMin?: number;
  @IsNumber() @IsOptional() dapGyCm2?: number;
  @IsNumber() @IsOptional() contrastVolumeMl?: number;
  @IsString() @IsOptional() michelsAnatomy?: string;
  @IsString() @IsOptional() embolicMaterial?: string;
  @IsString() @IsOptional() complications?: string;
  @IsString() @IsOptional() operatorUserId?: string;
  @IsIn(LOCK_STATUSES) @IsOptional() lockStatus?: (typeof LOCK_STATUSES)[number];
  @IsInt() @Min(1) version!: number;
}
