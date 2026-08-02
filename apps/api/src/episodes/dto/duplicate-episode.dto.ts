import { IsBoolean, IsOptional } from 'class-validator';

export class DuplicateEpisodeDto {
  @IsBoolean() @IsOptional() copyDiagnosisBasics?: boolean;
}
