import { IsString, IsOptional, IsNotEmpty, IsDateString, IsUUID, IsInt } from 'class-validator';

export class CreateToxicityEventDto {
  @IsUUID() @IsOptional() treatmentSessionId?: string;
  @IsDateString() @IsOptional() onsetDate?: string;
  @IsString() @IsNotEmpty() toxicityType!: string;
  @IsInt() @IsOptional() ctcaeGrade?: number;
  @IsString() @IsOptional() reildGrade?: string;
  @IsString() @IsOptional() outcome?: string;
  @IsDateString() @IsOptional() resolvedDate?: string;
  @IsString() @IsOptional() notes?: string;
}
