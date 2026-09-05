import { IsInt, Min } from 'class-validator';

export class ResumeEpisodeDto {
  @IsInt() @Min(1) version!: number;
}
