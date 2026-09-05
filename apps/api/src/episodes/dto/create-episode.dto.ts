import { IsString, IsOptional, IsIn, IsUUID, IsDateString, ValidateIf } from 'class-validator';

const EPISODE_TYPES = ['FIRST', 'REPEAT'] as const;

export class CreateEpisodeDto {
  @IsIn(EPISODE_TYPES) @IsOptional() firstOrRepeat?: (typeof EPISODE_TYPES)[number];
  // The service layer is the authoritative guard: it always discards
  // previousEpisodeId for non-REPEAT episodes regardless of what's sent
  // here (see EpisodesService.create) — a value submitted alongside
  // firstOrRepeat !== 'REPEAT' is silently ignored, never persisted or
  // used for an ownership check.
  @ValidateIf((o: CreateEpisodeDto) => o.firstOrRepeat === 'REPEAT') @IsUUID() previousEpisodeId?: string;
  @IsDateString() @IsOptional() referralDate?: string;
  @IsString() @IsOptional() referralSource?: string;
  @IsString() @IsOptional() referringClinicianOverride?: string;
}
