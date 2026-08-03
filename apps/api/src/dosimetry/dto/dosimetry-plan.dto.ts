import { Expose } from 'class-transformer';

export class DosimetryPlanDto {
  @Expose() id!: string;
  @Expose() episodeId!: string;
  @Expose() mappingSessionId!: string | null;
  @Expose() planDate!: Date;
  @Expose() planningModel!: string;
  @Expose() particleProduct!: string | null;
  @Expose() targetLiverVolumeCm3!: string | null;
  @Expose() treatedLiverVolumePercent!: string | null;
  @Expose() tumourLiverVolumeRatio!: string | null;
  @Expose() calculatedPrescribedActivityGbq!: string | null;
  @Expose() confirmedPrescribedActivityGbq!: string | null;
  @Expose() prescribedActivityOverrideReason!: string | null;
  @Expose() particleDensityCalc!: string | null;
  @Expose() lockStatus!: string;
  @Expose() approvedAt!: Date | null;
  @Expose() approvedById!: string | null;
  @Expose() version!: number;
  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;
}
