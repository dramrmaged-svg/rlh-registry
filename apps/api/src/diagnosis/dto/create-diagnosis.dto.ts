import { IsString, IsOptional, IsNotEmpty, IsDateString, IsBoolean, IsIn } from 'class-validator';

const BCLC_STAGES = ['STAGE_0', 'STAGE_A', 'STAGE_B', 'STAGE_C', 'STAGE_D'] as const;
const CP_GRADES = ['A', 'B', 'C'] as const;

export class CreateDiagnosisDto {
  @IsString() @IsNotEmpty() tumourType!: string;
  @IsString() @IsOptional() aetiology?: string;
  @IsDateString() @IsOptional() diagnosisDate?: string;
  @IsBoolean() @IsOptional() histologyConfirmed?: boolean;

  @IsIn(BCLC_STAGES) @IsOptional() confirmedBclcStage?: (typeof BCLC_STAGES)[number];
  @IsString() @IsOptional() bclcOverrideReason?: string;

  @IsString() @IsOptional() confirmedTStage?: string;
  @IsString() @IsOptional() confirmedNStage?: string;
  @IsString() @IsOptional() confirmedMStage?: string;
  @IsString() @IsOptional() tnmOverrideReason?: string;

  @IsIn(CP_GRADES) @IsOptional() confirmedCpGrade?: (typeof CP_GRADES)[number];
  @IsString() @IsOptional() cpOverrideReason?: string;

  @IsString() @IsOptional() meldOverrideReason?: string;
  @IsString() @IsOptional() albiOverrideReason?: string;
}
