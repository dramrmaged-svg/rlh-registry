import { Expose } from 'class-transformer';

export class ToxicityEventDto {
  @Expose() id!: string;
  @Expose() episodeId!: string;
  @Expose() treatmentSessionId!: string | null;
  @Expose() onsetDate!: Date | null;
  @Expose() toxicityType!: string;
  @Expose() ctcaeGrade!: number | null;
  @Expose() reildGrade!: string | null;
  @Expose() outcome!: string | null;
  @Expose() resolvedDate!: Date | null;
  @Expose() notes!: string | null;
  @Expose() lockStatus!: string;
  @Expose() version!: number;
  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;
}
