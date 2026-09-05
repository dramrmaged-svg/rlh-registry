import { Expose, Type } from 'class-transformer';
class IdentifierSummaryDto { @Expose() identifierType!: string; @Expose() value!: string; @Expose() isActive!: boolean; }
// Derived from the patient's most recent episode's Diagnosis (Diagnosis is
// episode-scoped, not patient-scoped — see docs/adr/0001-episode-architecture.md).
class DiagnosisSummaryDto { @Expose() tumourType!: string; @Expose() bclcStage!: string | null; }
export class PatientSummaryDto {
  @Expose() id!: string; @Expose() firstName!: string; @Expose() lastName!: string; @Expose() dateOfBirth!: Date; @Expose() sex!: string; @Expose() isActive!: boolean;
  @Expose() @Type(() => IdentifierSummaryDto) primaryIdentifier!: IdentifierSummaryDto | null;
  @Expose() @Type(() => DiagnosisSummaryDto) primaryDiagnosis!: DiagnosisSummaryDto | null;
  @Expose() lastMdtDecision!: string | null; @Expose() lastProcedureDate!: Date | null;
}
