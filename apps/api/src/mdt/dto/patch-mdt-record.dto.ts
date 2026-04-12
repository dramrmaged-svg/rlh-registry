import { IsString, IsOptional, IsBoolean, IsIn, IsInt, Min } from 'class-validator';
const MDT_DECISIONS = ['SIRT','MWA_ABLATION','RFA_ABLATION','TACE','TAE','SYSTEMIC_THERAPY','BEST_SUPPORTIVE_CARE','SURGICAL_RESECTION','TRANSPLANT_ASSESSMENT','ACTIVE_SURVEILLANCE','RE_DISCUSS','DECLINED','OTHER'] as const;
export class PatchMdtRecordDto {
  @IsString() @IsOptional() diseaseSummary?: string;
  @IsString() @IsOptional() priorTreatmentSummary?: string;
  @IsIn(MDT_DECISIONS) @IsOptional() decision?: (typeof MDT_DECISIONS)[number];
  @IsString() @IsOptional() decisionDetail?: string;
  @IsString() @IsOptional() decisionConditions?: string;
  @IsBoolean() @IsOptional() patientFitForProcedure?: boolean;
  @IsBoolean() @IsOptional() performanceStatusAcceptable?: boolean;
  @IsBoolean() @IsOptional() liverFunctionAcceptable?: boolean;
  @IsBoolean() @IsOptional() tumourLoadAcceptable?: boolean;
  @IsInt() @Min(1) version!: number;
}
