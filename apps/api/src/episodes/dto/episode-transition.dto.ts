import { IsString, IsOptional, IsIn, IsInt, Min, ValidateNested, IsArray, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { EPISODE_STATUSES } from '../episode-status-transitions';

export class OverrideWarningDto {
  @IsString() code!: string;
  @IsString() @MinLength(10) reason!: string;
}

export class EpisodeTransitionDto {
  @IsIn(EPISODE_STATUSES) toStatus!: (typeof EPISODE_STATUSES)[number];
  @IsString() @IsOptional() reason?: string;
  @ValidateNested({ each: true }) @Type(() => OverrideWarningDto) @IsArray() @IsOptional() overrideWarnings?: OverrideWarningDto[];
  @IsInt() @Min(1) version!: number;
}
