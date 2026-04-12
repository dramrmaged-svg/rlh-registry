import { Expose, Type } from 'class-transformer';
class IdentifierDto { @Expose() id!: string; @Expose() identifierType!: string; @Expose() value!: string; @Expose() issuingOrg!: string | null; @Expose() isPrimary!: boolean; @Expose() isActive!: boolean; }
class DiagnosisSummaryDto { @Expose() id!: string; @Expose() tumourType!: string; @Expose() baselineBclcStage!: string | null; @Expose() isPrimary!: boolean; }
export class PatientDetailDto {
  @Expose() id!: string; @Expose() firstName!: string; @Expose() lastName!: string; @Expose() dateOfBirth!: Date; @Expose() sex!: string;
  @Expose() ethnicity!: string | null; @Expose() countryOfBirth!: string | null; @Expose() gpPractice!: string | null; @Expose() gpName!: string | null;
  @Expose() referringHospital!: string | null; @Expose() referringClinician!: string | null; @Expose() nhsNumberPendingUntil!: Date | null;
  @Expose() isActive!: boolean; @Expose() version!: number; @Expose() createdAt!: Date; @Expose() updatedAt!: Date;
  @Expose() @Type(() => IdentifierDto) identifiers!: IdentifierDto[];
  @Expose() @Type(() => DiagnosisSummaryDto) primaryDiagnosis!: DiagnosisSummaryDto | null;
}
