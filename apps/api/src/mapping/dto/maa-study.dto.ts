import { Expose } from 'class-transformer';

export class MaaStudyDto {
  @Expose() id!: string;
  @Expose() mappingSessionId!: string;
  @Expose() studyDate!: Date;
  @Expose() injectedActivityMbq!: string | null;
  @Expose() lungShuntFraction!: string | null;
  @Expose() calculatedLsfRiskBand!: string | null;
  @Expose() extrahepaticUptake!: boolean | null;
  @Expose() extrahepaticUptakeSites!: string | null;
  @Expose() maaDistributionMatchesTarget!: boolean | null;
  @Expose() balanceCheckPass!: boolean | null;
  @Expose() calculationVersion!: string | null;
  @Expose() createdAt!: Date;
}
