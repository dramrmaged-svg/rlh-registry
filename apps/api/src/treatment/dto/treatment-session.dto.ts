import { Expose } from 'class-transformer';

export class TreatmentSessionDto {
  @Expose() id!: string;
  @Expose() episodeId!: string;
  @Expose() dosimetryPlanId!: string | null;
  @Expose() sessionDate!: Date;
  @Expose() sessionNumber!: number;
  @Expose() status!: string | null;
  @Expose() accessRoute!: string | null;
  @Expose() accessSite!: string | null;
  @Expose() catheterType!: string | null;
  @Expose() fluoroTimeMin!: string | null;
  @Expose() dapGyCm2!: string | null;
  @Expose() contrastVolumeMl!: string | null;
  @Expose() embolicMaterial!: string | null;
  @Expose() particleProduct!: string | null;
  @Expose() administeredActivityGbq!: string | null;
  @Expose() maaBalanceCheckedAtDelivery!: boolean | null;
  @Expose() complications!: string | null;
  @Expose() operatorUserId!: string | null;
  @Expose() lockStatus!: string;
  @Expose() version!: number;
  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;
}
