import { IsNumber, IsOptional, IsIn, IsBoolean, IsString } from 'class-validator';

const SEX_VALUES = ['MALE', 'FEMALE', 'INDETERMINATE', 'UNKNOWN'] as const;

/**
 * Transient clinical inputs used only to run the calculation engine — not
 * persisted as raw fields on Diagnosis. Raw labs/ECOG capture belongs to a
 * future LabPanel/ClinicalScore module (out of scope this phase); this
 * endpoint exists so the Phase 1 calculation engine is reachable via the API
 * now rather than staying dormant until that module exists.
 */
export class RecalculateDiagnosisDto {
  @IsNumber() @IsOptional() bilirubinUmolL?: number;
  @IsNumber() @IsOptional() albuminGL?: number;
  @IsNumber() @IsOptional() inr?: number;
  @IsNumber() @IsOptional() creatinineUmolL?: number;
  @IsNumber() @IsOptional() sodiumMmolL?: number;
  @IsIn(SEX_VALUES) @IsOptional() sex?: (typeof SEX_VALUES)[number];
  @IsBoolean() @IsOptional() onDialysis?: boolean;
  @IsString() @IsOptional() ascites?: string;
  @IsString() @IsOptional() encephalopathy?: string;
  @IsNumber() @IsOptional() ecogScore?: number;
  @IsNumber() @IsOptional() tumourCount?: number;
  @IsNumber() @IsOptional() largestDiameterCm?: number;
  @IsString() @IsOptional() pvtt?: string;
  @IsBoolean() @IsOptional() extrahepaticSpread?: boolean;
}
