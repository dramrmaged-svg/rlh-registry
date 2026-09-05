import { Expose } from 'class-transformer';

export class EpisodeSummaryDto {
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
  @Expose() statusChangedAt!: Date | null;
  @Expose() version!: number;
  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;
}
