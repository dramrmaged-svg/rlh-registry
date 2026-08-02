import { Expose, Type } from 'class-transformer';

class DiagnosisSummaryDto {
  @Expose() id!: string;
  @Expose() tumourType!: string;
  @Expose() aetiology!: string | null;
  @Expose() confirmedBclcStage!: string | null;
  @Expose() confirmedCpGrade!: string | null;
}

class EpisodeCompletenessDto {
  @Expose() hasDiagnosis!: boolean;
  @Expose() mdtRecordCount!: number;
  @Expose() lesionCount!: number;
  @Expose() mappingSessionCount!: number;
  @Expose() dosimetryPlanCount!: number;
  @Expose() treatmentSessionCount!: number;
  @Expose() followUpCount!: number;
  @Expose() toxicityEventCount!: number;
}

export class EpisodeDetailDto {
  @Expose() id!: string;
  @Expose() patientId!: string;
  @Expose() episodeNumber!: number;
  @Expose() firstOrRepeat!: string;
  @Expose() previousEpisodeId!: string | null;
  @Expose() status!: string;
  @Expose() deferredFromStatus!: string | null;
  @Expose() availableActions!: string[];
  @Expose() referralDate!: Date | null;
  @Expose() referralSource!: string | null;
  @Expose() referringClinicianOverride!: string | null;
  @Expose() statusChangedAt!: Date | null;
  @Expose() @Type(() => DiagnosisSummaryDto) diagnosis!: DiagnosisSummaryDto | null;
  @Expose() @Type(() => EpisodeCompletenessDto) completeness!: EpisodeCompletenessDto;
  @Expose() version!: number;
  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;
}
