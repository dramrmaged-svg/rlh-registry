import { Expose } from 'class-transformer';

export class DoseInjectionDto {
  @Expose() id!: string;
  @Expose() treatmentSessionId!: string;
  @Expose() lesionId!: string;
  @Expose() lesionFeederId!: string | null;
  @Expose() deliveredActivityGbq!: string | null;
  @Expose() deliveredDoseGy!: string | null;
  @Expose() particleCount!: string | null;
  @Expose() notes!: string | null;
  @Expose() createdAt!: Date;
}
