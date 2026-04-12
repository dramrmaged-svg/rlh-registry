import { Expose, Type } from 'class-transformer';
class MdtSessionSummaryDto { @Expose() id!: string; @Expose() sessionDate!: Date; @Expose() location!: string | null; @Expose() chair!: string | null; }
class UserSummaryDto { @Expose() id!: string; @Expose() firstName!: string; @Expose() lastName!: string; @Expose() title!: string | null; }
class ClinicalSnapshotSummaryDto {
  @Expose() id!: string; @Expose() snapshotDate!: Date; @Expose() snapshotContext!: string; @Expose() ecogScore!: number | null;
  @Expose() cpGrade!: string | null; @Expose() cpTotalScore!: number | null; @Expose() meldNaScoreRounded!: number | null;
  @Expose() albiGrade!: number | null; @Expose() bclcStage!: string | null; @Expose() labPanelCollectedAt!: Date | null; @Expose() clinicalScoreDate!: Date | null;
}
export class MdtRecordDto {
  @Expose() id!: string; @Expose() patientId!: string; @Expose() mdtSessionId!: string;
  @Expose() @Type(() => MdtSessionSummaryDto) mdtSession!: MdtSessionSummaryDto;
  @Expose() clinicalSnapshotId!: string | null;
  @Expose() @Type(() => ClinicalSnapshotSummaryDto) clinicalSnapshot!: ClinicalSnapshotSummaryDto | null;
  @Expose() diseaseSummary!: string | null; @Expose() priorTreatmentSummary!: string | null; @Expose() decision!: string | null;
  @Expose() decisionDetail!: string | null; @Expose() decisionConditions!: string | null;
  @Expose() patientFitForProcedure!: boolean | null; @Expose() performanceStatusAcceptable!: boolean | null;
  @Expose() liverFunctionAcceptable!: boolean | null; @Expose() tumourLoadAcceptable!: boolean | null;
  @Expose() lockStatus!: string; @Expose() availableActions!: string[];
  @Expose() submittedAt!: Date | null; @Expose() submittedById!: string | null; @Expose() lockedAt!: Date | null; @Expose() lockedById!: string | null;
  @Expose() @Type(() => UserSummaryDto) lockedBy!: UserSummaryDto | null;
  @Expose() version!: number; @Expose() createdAt!: Date; @Expose() updatedAt!: Date;
}
