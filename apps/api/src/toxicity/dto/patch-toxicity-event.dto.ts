import { IsString, IsOptional, IsDateString, IsUUID, IsInt, Min, IsIn } from 'class-validator';

const LOCK_STATUSES = ['DRAFT', 'SUBMITTED', 'LOCKED'] as const;

export class PatchToxicityEventDto {
  @IsUUID() @IsOptional() treatmentSessionId?: string;
  // null is meaningful here: clears a previously-set date rather than being ignored.
  @IsDateString() @IsOptional() onsetDate?: string | null;
  @IsString() @IsOptional() toxicityType?: string;
  @IsInt() @IsOptional() ctcaeGrade?: number;
  @IsString() @IsOptional() reildGrade?: string;
  @IsString() @IsOptional() outcome?: string;
  @IsDateString() @IsOptional() resolvedDate?: string | null;
  @IsString() @IsOptional() notes?: string;
  @IsIn(LOCK_STATUSES) @IsOptional() lockStatus?: (typeof LOCK_STATUSES)[number];
  @IsInt() @Min(1) version!: number;
}
