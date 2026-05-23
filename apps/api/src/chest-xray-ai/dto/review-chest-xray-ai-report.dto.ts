import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export const REVIEW_STATUSES = ['CONFIRMED', 'REJECTED', 'AMENDED'] as const;

export class ReviewChestXrayAiReportDto {
  @IsIn(REVIEW_STATUSES) reviewStatus!: (typeof REVIEW_STATUSES)[number];
  @IsString() @IsOptional() reviewNotes?: string;
  @IsInt() version!: number;
}
