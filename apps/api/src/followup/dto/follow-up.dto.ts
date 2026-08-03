import { Expose } from 'class-transformer';

export class FollowUpDto {
  @Expose() id!: string;
  @Expose() episodeId!: string;
  @Expose() lesionId!: string | null;
  @Expose() followUpDate!: Date;
  @Expose() intendedTimepoint!: string | null;
  @Expose() intervalMonths!: number | null;
  @Expose() visitType!: string | null;
  @Expose() overallResponse!: string | null;
  @Expose() lockStatus!: string;
  @Expose() version!: number;
  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;
}
