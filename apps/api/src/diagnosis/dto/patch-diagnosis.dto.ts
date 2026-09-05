import { IsString, IsOptional, IsDateString, IsBoolean, IsIn, IsInt, Min } from 'class-validator';

const BCLC_STAGES = ['STAGE_0', 'STAGE_A', 'STAGE_B', 'STAGE_C', 'STAGE_D'] as const;
const CP_GRADES = ['A', 'B', 'C'] as const;

export class PatchDiagnosisDto {
  @IsString() @IsOptional() tumourType?: string;
  @IsString() @IsOptional() aetiology?: string;
  // null clears a previously-set diagnosis date — see PatchEpisodeDto.referralDate for why this must stay nullable.
  @IsDateString() @IsOptional() diagnosisDate?: string | null;
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

  @IsInt() @Min(1) version!: number;
}
