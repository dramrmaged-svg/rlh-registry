import { Expose } from 'class-transformer';

export class DiagnosisDto {
  @Expose() id!: string;
  @Expose() episodeId!: string;
  @Expose() tumourType!: string;
  @Expose() aetiology!: string | null;
  @Expose() diagnosisDate!: Date | null;
  @Expose() histologyConfirmed!: boolean | null;

  @Expose() calculatedBclcStage!: string | null;
  @Expose() confirmedBclcStage!: string | null;
  @Expose() bclcOverrideReason!: string | null;

  @Expose() calculatedTStage!: string | null;
  @Expose() calculatedNStage!: string | null;
  @Expose() calculatedMStage!: string | null;
  @Expose() confirmedTStage!: string | null;
  @Expose() confirmedNStage!: string | null;
  @Expose() confirmedMStage!: string | null;
  @Expose() tnmOverrideReason!: string | null;

  @Expose() calculatedCpScore!: number | null;
  @Expose() calculatedCpGrade!: string | null;
  @Expose() confirmedCpGrade!: string | null;
  @Expose() cpOverrideReason!: string | null;

  @Expose() calculatedMeld3Score!: string | null;
  @Expose() calculatedMeldNaScore!: string | null;
  @Expose() meldOverrideReason!: string | null;

  @Expose() calculatedAlbiScore!: string | null;
  @Expose() calculatedAlbiGrade!: number | null;
  @Expose() albiOverrideReason!: string | null;

  @Expose() calculationVersion!: string | null;
  @Expose() version!: number;
  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;
}

export class CalculationSummaryDto {
  @Expose() formulaId!: string;
  @Expose() status!: string;
  @Expose() explanation!: string;
  @Expose() missingFields!: string[];
}
