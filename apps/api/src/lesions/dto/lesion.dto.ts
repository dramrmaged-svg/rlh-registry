import { Expose } from 'class-transformer';

export class LesionDto {
  @Expose() id!: string;
  @Expose() episodeId!: string;
  @Expose() lesionNumber!: number;
  @Expose() segment!: string | null;
  @Expose() laterality!: string | null;
  @Expose() isTargetLesion!: boolean;
  @Expose() diameterAxialMm!: string | null;
  @Expose() diameterCraniocaudalMm!: string | null;
  @Expose() diameterApMm!: string | null;
  @Expose() calculatedVolumeCm3!: string | null;
  @Expose() lirads!: string | null;
  @Expose() notes!: string | null;
  @Expose() version!: number;
  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;
}
