import { IsString, IsOptional, IsDateString, IsUUID, IsInt, Min, IsIn } from 'class-validator';

const LOCK_STATUSES = ['DRAFT', 'SUBMITTED', 'LOCKED'] as const;

export class PatchFollowUpDto {
  @IsUUID() @IsOptional() lesionId?: string;
  // null clears a previously-set follow-up date's optional sibling fields is not applicable here (followUpDate itself is required, never cleared).
  @IsDateString() @IsOptional() followUpDate?: string;
  @IsString() @IsOptional() intendedTimepoint?: string;
  @IsInt() @IsOptional() intervalMonths?: number;
  @IsString() @IsOptional() visitType?: string;
  @IsString() @IsOptional() overallResponse?: string;
  @IsIn(LOCK_STATUSES) @IsOptional() lockStatus?: (typeof LOCK_STATUSES)[number];
  @IsInt() @Min(1) version!: number;
}
