import { Injectable, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService, type PrismaTx } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateChestXrayAiReportDto } from './dto/create-chest-xray-ai-report.dto';
import { ReviewChestXrayAiReportDto } from './dto/review-chest-xray-ai-report.dto';
import { ChestXrayAiReportDto, ChestXrayAiFindingDto } from './dto/chest-xray-ai-report.dto';
import type { UserResponseDto } from '../users/dto/user-response.dto';
import type { Role } from '@prisma/client';
import type { Request } from 'express';
import { ApiException } from '../common/filters/global-exception.filter';
import { throwNotFound, throwOptimisticLockConflict } from '../common/helpers/conflict.helper';
import { buildChangedFields } from '../common/helpers/changed-fields.helper';

const REPORT_QUERY = {
  include: { findings: { orderBy: { findingType: 'asc' as const } } },
} as const;

type RawReport = Prisma.ChestXrayAiReportGetPayload<typeof REPORT_QUERY>;

function toReportDto(raw: RawReport): ChestXrayAiReportDto {
  return plainToInstance(
    ChestXrayAiReportDto,
    {
      ...raw,
      findings: raw.findings.map((f) =>
        plainToInstance(ChestXrayAiFindingDto, { ...f, confidenceScore: Number(f.confidenceScore) }, { excludeExtraneousValues: true }),
      ),
    },
    { excludeExtraneousValues: true },
  );
}

@Injectable()
export class ChestXrayAiService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async listForPatient(patientId: string): Promise<ChestXrayAiReportDto[]> {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throwNotFound('Patient', patientId);
    const reports = await this.prisma.chestXrayAiReport.findMany({
      where: { patientId },
      ...REPORT_QUERY,
      orderBy: { studyDate: 'desc' },
    });
    return reports.map(toReportDto);
  }

  async getReport(id: string): Promise<ChestXrayAiReportDto> {
    const report = await this.prisma.chestXrayAiReport.findUnique({ where: { id }, ...REPORT_QUERY });
    if (!report) throwNotFound('ChestXrayAiReport', id);
    return toReportDto(report);
  }

  async create(patientId: string, dto: CreateChestXrayAiReportDto, currentUser: UserResponseDto, request: Request): Promise<ChestXrayAiReportDto> {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throwNotFound('Patient', patientId);

    if (dto.imagingStudyId) {
      const study = await this.prisma.imagingStudy.findUnique({ where: { id: dto.imagingStudyId } });
      if (!study) throwNotFound('ImagingStudy', dto.imagingStudyId);
      if (study.patientId !== patientId) {
        throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, 'IMAGING_STUDY_PATIENT_MISMATCH', 'The imaging study does not belong to this patient.', { imagingStudyId: dto.imagingStudyId, patientId });
      }
    }

    const report = await this.prisma.withinTransaction(async (tx: PrismaTx) => {
      const created = await tx.chestXrayAiReport.create({
        data: {
          patientId,
          imagingStudyId: dto.imagingStudyId ?? null,
          studyDate: new Date(dto.studyDate),
          aiModelName: dto.aiModelName,
          aiModelVersion: dto.aiModelVersion,
          processedAt: new Date(dto.processedAt),
          reviewStatus: 'PENDING_REVIEW',
          createdById: currentUser.id,
          findings: {
            create: dto.findings.map((f) => ({
              findingType: f.findingType,
              laterality: f.laterality ?? 'NA',
              confidenceScore: f.confidenceScore,
              isPresent: f.isPresent,
              severity: f.severity ?? null,
            })),
          },
        },
        ...REPORT_QUERY,
      });
      await this.auditService.logInTx(tx, {
        eventType: 'CREATE',
        entityType: 'ChestXrayAiReport',
        entityId: created.id,
        userId: currentUser.id,
        roleAtTime: currentUser.role as Role,
        afterSnapshot: created as unknown as Record<string, unknown>,
        ipAddress: request.ip ?? null,
        userAgent: request.headers['user-agent'] ?? null,
        metadata: { findingCount: dto.findings.length },
      });
      return created;
    }, 'read-committed');

    return toReportDto(report);
  }

  async review(id: string, dto: ReviewChestXrayAiReportDto, currentUser: UserResponseDto, request: Request): Promise<ChestXrayAiReportDto> {
    const existing = await this.prisma.chestXrayAiReport.findUnique({ where: { id }, ...REPORT_QUERY });
    if (!existing) throwNotFound('ChestXrayAiReport', id);

    if (existing.reviewStatus === 'CONFIRMED' || existing.reviewStatus === 'REJECTED') {
      throw new ApiException(
        HttpStatus.CONFLICT,
        'REPORT_ALREADY_REVIEWED',
        `This report has already been ${existing.reviewStatus.toLowerCase()} and cannot be re-reviewed.`,
        { reportId: id, currentStatus: existing.reviewStatus },
      );
    }

    const updated = await this.prisma.withinTransaction(async (tx: PrismaTx) => {
      const result = await tx.chestXrayAiReport.updateMany({
        where: { id, version: dto.version },
        data: {
          reviewStatus: dto.reviewStatus,
          reviewedById: currentUser.id,
          reviewedAt: new Date(),
          reviewNotes: dto.reviewNotes ?? null,
          version: { increment: 1 },
        },
      });

      if (result.count === 0) {
        const current = await tx.chestXrayAiReport.findUnique({ where: { id }, select: { version: true } });
        if (!current) throwNotFound('ChestXrayAiReport', id);
        throwOptimisticLockConflict({ entityType: 'ChestXrayAiReport', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
      }

      const fresh = await tx.chestXrayAiReport.findUnique({ where: { id }, ...REPORT_QUERY });
      if (!fresh) throwNotFound('ChestXrayAiReport', id);

      await this.auditService.logInTx(tx, {
        eventType: 'UPDATE',
        entityType: 'ChestXrayAiReport',
        entityId: id,
        userId: currentUser.id,
        roleAtTime: currentUser.role as Role,
        beforeSnapshot: existing as unknown as Record<string, unknown>,
        afterSnapshot: fresh as unknown as Record<string, unknown>,
        changedFields: buildChangedFields(
          existing as unknown as Record<string, unknown>,
          fresh as unknown as Record<string, unknown>,
          dto as unknown as Record<string, unknown>,
        ),
        ipAddress: request.ip ?? null,
        userAgent: request.headers['user-agent'] ?? null,
        metadata: null,
      });

      return fresh;
    });

    return toReportDto(updated);
  }
}
