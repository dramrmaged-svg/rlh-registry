import { IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class CreateMappingSessionDto {
  @IsDateString() sessionDate!: string;
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
}
