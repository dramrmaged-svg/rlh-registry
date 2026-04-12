import { Expose, Type } from 'class-transformer';
class IdentifierSummaryDto { @Expose() identifierType!: string; @Expose() value!: string; @Expose() isActive!: boolean; }
class DiagnosisSummaryDto { @Expose() tumourType!: string; @Expose() baselineBclcStage!: string | null; }
export class PatientSummaryDto {
  @Expose() id!: string; @Expose() firstName!: string; @Expose() lastName!: string; @Expose() dateOfBirth!: Date; @Expose() sex!: string; @Expose() isActive!: boolean;
  @Expose() @Type(() => IdentifierSummaryDto) primaryIdentifier!: IdentifierSummaryDto | null;
  @Expose() @Type(() => DiagnosisSummaryDto) primaryDiagnosis!: DiagnosisSummaryDto | null;
  @Expose() lastMdtDecision!: string | null; @Expose() lastProcedureDate!: Date | null;
}
