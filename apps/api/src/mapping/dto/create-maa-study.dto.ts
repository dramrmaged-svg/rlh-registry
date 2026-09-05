import { IsString, IsOptional, IsDateString, IsNumber, IsBoolean } from 'class-validator';

export class CreateMaaStudyDto {
  @IsDateString() studyDate!: string;
  @IsNumber() @IsOptional() injectedActivityMbq?: number;
  @IsNumber() @IsOptional() lungShuntFraction?: number;
  @IsBoolean() @IsOptional() extrahepaticUptake?: boolean;
  @IsString() @IsOptional() extrahepaticUptakeSites?: string;
  @IsBoolean() @IsOptional() maaDistributionMatchesTarget?: boolean;
  @IsBoolean() @IsOptional() balanceCheckPass?: boolean;
}
