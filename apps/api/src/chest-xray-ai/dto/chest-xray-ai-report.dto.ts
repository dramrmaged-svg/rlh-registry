import { Expose, Type } from 'class-transformer';

export class ChestXrayAiFindingDto {
  @Expose() id!: string;
  @Expose() findingType!: string;
  @Expose() laterality!: string;
  @Expose() confidenceScore!: number;
  @Expose() isPresent!: boolean;
  @Expose() severity!: string | null;
  @Expose() radiologistNote!: string | null;
  @Expose() createdAt!: Date;
}

export class ChestXrayAiReportDto {
  @Expose() id!: string;
  @Expose() patientId!: string;
  @Expose() imagingStudyId!: string | null;
  @Expose() studyDate!: Date;
  @Expose() aiModelName!: string;
  @Expose() aiModelVersion!: string;
  @Expose() processedAt!: Date;
  @Expose() reviewStatus!: string;
  @Expose() reviewedById!: string | null;
  @Expose() reviewedAt!: Date | null;
  @Expose() reviewNotes!: string | null;
  @Expose() version!: number;
  @Expose() createdById!: string;
  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;
  @Expose() @Type(() => ChestXrayAiFindingDto) findings!: ChestXrayAiFindingDto[];
}
