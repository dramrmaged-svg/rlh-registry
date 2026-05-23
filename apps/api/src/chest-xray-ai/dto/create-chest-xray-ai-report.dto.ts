import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';

export const CHEST_XRAY_FINDING_TYPES = [
  'CARDIOMEGALY', 'PLEURAL_EFFUSION', 'PNEUMOTHORAX', 'CONSOLIDATION',
  'ATELECTASIS', 'PULMONARY_OEDEMA', 'NODULE_MASS', 'PNEUMOPERITONEUM',
  'RIB_FRACTURE', 'SPINE_FRACTURE', 'NO_FINDING',
] as const;

export const CHEST_XRAY_LATERALITY = ['LEFT', 'RIGHT', 'BILATERAL', 'NA'] as const;

export class CreateChestXrayAiFindingDto {
  @IsIn(CHEST_XRAY_FINDING_TYPES) findingType!: (typeof CHEST_XRAY_FINDING_TYPES)[number];
  @IsIn(CHEST_XRAY_LATERALITY) @IsOptional() laterality?: (typeof CHEST_XRAY_LATERALITY)[number];
  @IsNumber() @Min(0) @Max(1) confidenceScore!: number;
  @IsBoolean() isPresent!: boolean;
  @IsString() @IsOptional() severity?: string;
}

export class CreateChestXrayAiReportDto {
  @IsUUID() @IsOptional() imagingStudyId?: string;
  @IsDateString() studyDate!: string;
  @IsString() aiModelName!: string;
  @IsString() aiModelVersion!: string;
  @IsDateString() processedAt!: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateChestXrayAiFindingDto) findings!: CreateChestXrayAiFindingDto[];
}
