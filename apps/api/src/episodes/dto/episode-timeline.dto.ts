import { Expose } from 'class-transformer';

export class EpisodeTimelineEventDto {
  @Expose() type!: string;
  @Expose() label!: string;
  @Expose() date!: Date | null;
  @Expose() entityId!: string | null;
}
