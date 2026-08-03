import { IsString, IsOptional, IsNotEmpty, IsDateString, IsNumber, IsUUID } from 'class-validator';

export class CreateDosimetryPlanDto {
  @IsUUID() @IsOptional() mappingSessionId?: string;
  @IsDateString() planDate!: string;
  @IsString() @IsNotEmpty() planningModel!: string;
  @IsString() @IsOptional() particleProduct?: string;
  @IsNumber() @IsOptional() targetLiverVolumeCm3?: number;
  @IsNumber() @IsOptional() treatedLiverVolumePercent?: number;
  @IsNumber() @IsOptional() tumourLiverVolumeRatio?: number;
  @IsNumber() @IsOptional() confirmedPrescribedActivityGbq?: number;
  @IsString() @IsOptional() prescribedActivityOverrideReason?: string;
  @IsNumber() @IsOptional() particleDensityCalc?: number;
}
