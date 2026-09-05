import { IsString, IsOptional, IsDateString, IsNumber, IsUUID, IsBoolean, ValidateNested, IsArray, MinLength, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OverrideWarningDto {
  @IsString() code!: string;
  @IsString() @MinLength(10) reason!: string;
}

export class CreateTreatmentSessionDto {
  @IsUUID() @IsOptional() dosimetryPlanId?: string;
  @IsDateString() sessionDate!: string;
  @IsInt() @Min(1) @IsOptional() sessionNumber?: number;
  @IsString() @IsOptional() status?: string;
  @IsString() @IsOptional() accessRoute?: string;
  @IsString() @IsOptional() accessSite?: string;
  @IsString() @IsOptional() catheterType?: string;
  @IsNumber() @IsOptional() fluoroTimeMin?: number;
  @IsNumber() @IsOptional() dapGyCm2?: number;
  @IsNumber() @IsOptional() contrastVolumeMl?: number;
  @IsString() @IsOptional() embolicMaterial?: string;
  @IsString() @IsOptional() particleProduct?: string;
  @IsNumber() @IsOptional() administeredActivityGbq?: number;
  @IsBoolean() @IsOptional() maaBalanceCheckedAtDelivery?: boolean;
  @IsString() @IsOptional() complications?: string;
  @IsString() @IsOptional() operatorUserId?: string;
  @ValidateNested({ each: true }) @Type(() => OverrideWarningDto) @IsArray() @IsOptional() overrideWarnings?: OverrideWarningDto[];
}
