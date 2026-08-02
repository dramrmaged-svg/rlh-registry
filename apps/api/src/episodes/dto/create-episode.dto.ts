import { IsString, IsOptional, IsIn, IsUUID, IsDateString, ValidateIf } from 'class-validator';

const EPISODE_TYPES = ['FIRST', 'REPEAT'] as const;

export class CreateEpisodeDto {
  @IsIn(EPISODE_TYPES) @IsOptional() firstOrRepeat?: (typeof EPISODE_TYPES)[number];
  @ValidateIf((o: CreateEpisodeDto) => o.firstOrRepeat === 'REPEAT') @IsUUID() previousEpisodeId?: string;
  @IsDateString() @IsOptional() referralDate?: string;
  @IsString() @IsOptional() referralSource?: string;
  @IsString() @IsOptional() referringClinicianOverride?: string;
}
