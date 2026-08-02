import { IsString, IsOptional, IsDateString, IsInt, Min } from 'class-validator';

export class PatchEpisodeDto {
  @IsDateString() @IsOptional() referralDate?: string;
  @IsString() @IsOptional() referralSource?: string;
  @IsString() @IsOptional() referringClinicianOverride?: string;
  @IsInt() @Min(1) version!: number;
}
