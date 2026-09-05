import { IsString, IsOptional, IsDateString, IsUUID, IsInt } from 'class-validator';

export class CreateFollowUpDto {
  @IsUUID() @IsOptional() lesionId?: string;
  @IsDateString() followUpDate!: string;
  @IsString() @IsOptional() intendedTimepoint?: string;
  @IsInt() @IsOptional() intervalMonths?: number;
  @IsString() @IsOptional() visitType?: string;
  @IsString() @IsOptional() overallResponse?: string;
}
