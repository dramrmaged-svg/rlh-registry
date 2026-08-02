import { IsString, IsOptional, IsDateString, IsInt, Min } from 'class-validator';

export class PatchEpisodeDto {
  // null is accepted (and meaningful) here: it clears a previously-set
  // referral date rather than being ignored — @IsOptional() treats null as
  // "skip further validators", so @IsDateString() only runs against a real
  // string value.
  @IsDateString() @IsOptional() referralDate?: string | null;
  @IsString() @IsOptional() referralSource?: string;
  @IsString() @IsOptional() referringClinicianOverride?: string;
  @IsInt() @Min(1) version!: number;
}
