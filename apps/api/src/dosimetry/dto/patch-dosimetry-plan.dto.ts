import { IsString, IsOptional, IsDateString, IsNumber, IsUUID, IsInt, Min, IsIn } from 'class-validator';

const LOCK_STATUSES = ['DRAFT', 'SUBMITTED', 'LOCKED'] as const;

export class PatchDosimetryPlanDto {
  @IsUUID() @IsOptional() mappingSessionId?: string;
  @IsDateString() @IsOptional() planDate?: string;
  @IsString() @IsOptional() planningModel?: string;
  @IsString() @IsOptional() particleProduct?: string;
  @IsNumber() @IsOptional() targetLiverVolumeCm3?: number;
  @IsNumber() @IsOptional() treatedLiverVolumePercent?: number;
  @IsNumber() @IsOptional() tumourLiverVolumeRatio?: number;
  @IsNumber() @IsOptional() confirmedPrescribedActivityGbq?: number;
  @IsString() @IsOptional() prescribedActivityOverrideReason?: string;
  @IsNumber() @IsOptional() particleDensityCalc?: number;
  @IsIn(LOCK_STATUSES) @IsOptional() lockStatus?: (typeof LOCK_STATUSES)[number];
  @IsInt() @Min(1) version!: number;
}
