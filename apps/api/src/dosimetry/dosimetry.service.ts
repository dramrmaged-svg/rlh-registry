import { Injectable, HttpStatus } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateDosimetryPlanDto } from './dto/create-dosimetry-plan.dto';
import { PatchDosimetryPlanDto } from './dto/patch-dosimetry-plan.dto';
import { DosimetryPlanDto } from './dto/dosimetry-plan.dto';
import type { UserResponseDto } from '../users/dto/user-response.dto';
import type { Role } from '@prisma/client';
import type { Request } from 'express';
import { ApiException } from '../common/filters/global-exception.filter';
import { throwNotFound, throwOptimisticLockConflict } from '../common/helpers/conflict.helper';
import { buildChangedFields } from '../common/helpers/changed-fields.helper';
import { serializeDecimals } from '../common/helpers/decimal.helper';
import { alreadyInState, transitioned } from '../common/types/action-response.type';

function toDto(record: Record<string, unknown>): DosimetryPlanDto {
  return plainToInstance(DosimetryPlanDto, serializeDecimals(record), { excludeExtraneousValues: true });
}

@Injectable()
export class DosimetryService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async listForEpisode(episodeId: string): Promise<DosimetryPlanDto[]> {
    const plans = await this.prisma.dosimetryPlan.findMany({ where: { episodeId }, orderBy: { planDate: 'asc' } });
    return plans.map(toDto);
  }

  async getById(id: string): Promise<DosimetryPlanDto> {
    const plan = await this.prisma.dosimetryPlan.findUnique({ where: { id } });
    if (!plan) throwNotFound('DosimetryPlan', id);
    return toDto(plan);
  }

  async create(episodeId: string, dto: CreateDosimetryPlanDto, currentUser: UserResponseDto, request: Request): Promise<DosimetryPlanDto> {
    const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
    if (!episode) throwNotFound('Episode', episodeId);
    if (dto.mappingSessionId) {
      const session = await this.prisma.mappingSession.findUnique({ where: { id: dto.mappingSessionId } });
      if (!session || session.deletedAt !== null || session.episodeId !== episodeId) {
        throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, 'MAPPING_SESSION_EPISODE_MISMATCH', 'mappingSessionId must reference a mapping session belonging to the same episode.', { mappingSessionId: dto.mappingSessionId, episodeId });
      }
    }
    const created = await this.prisma.withinTransaction(async (tx) => {
      const plan = await tx.dosimetryPlan.create({
        data: {
          episodeId,
          mappingSessionId: dto.mappingSessionId ?? null,
          planDate: new Date(dto.planDate),
          planningModel: dto.planningModel,
          particleProduct: dto.particleProduct ?? null,
          targetLiverVolumeCm3: dto.targetLiverVolumeCm3 ?? null,
          treatedLiverVolumePercent: dto.treatedLiverVolumePercent ?? null,
          tumourLiverVolumeRatio: dto.tumourLiverVolumeRatio ?? null,
          confirmedPrescribedActivityGbq: dto.confirmedPrescribedActivityGbq ?? null,
          prescribedActivityOverrideReason: dto.prescribedActivityOverrideReason ?? null,
          particleDensityCalc: dto.particleDensityCalc ?? null,
          createdById: currentUser.id,
          updatedById: currentUser.id,
        },
      });
      await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'DosimetryPlan', entityId: plan.id, userId: currentUser.id, roleAtTime: currentUser.role as Role, afterSnapshot: plan as unknown as Record<string, unknown>, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
      return plan;
    }, 'serializable');
    return toDto(created);
  }

  async patch(id: string, dto: PatchDosimetryPlanDto, currentUser: UserResponseDto, request: Request): Promise<DosimetryPlanDto> {
    const existing = await this.prisma.dosimetryPlan.findUnique({ where: { id } });
    if (!existing) throwNotFound('DosimetryPlan', id);
    if (existing.approvedAt !== null) throw new ApiException(HttpStatus.CONFLICT, 'RECORD_LOCKED', 'This dosimetry plan is already approved and cannot be edited.', { entityId: id });
    const updated = await this.prisma.withinTransaction(async (tx) => {
      const result = await tx.dosimetryPlan.updateMany({
        where: { id, version: dto.version, deletedAt: null, approvedAt: null },
        data: {
          ...(dto.mappingSessionId !== undefined && { mappingSessionId: dto.mappingSessionId }),
          ...(dto.planDate !== undefined && { planDate: new Date(dto.planDate) }),
          ...(dto.planningModel !== undefined && { planningModel: dto.planningModel }),
          ...(dto.particleProduct !== undefined && { particleProduct: dto.particleProduct }),
          ...(dto.targetLiverVolumeCm3 !== undefined && { targetLiverVolumeCm3: dto.targetLiverVolumeCm3 }),
          ...(dto.treatedLiverVolumePercent !== undefined && { treatedLiverVolumePercent: dto.treatedLiverVolumePercent }),
          ...(dto.tumourLiverVolumeRatio !== undefined && { tumourLiverVolumeRatio: dto.tumourLiverVolumeRatio }),
          ...(dto.confirmedPrescribedActivityGbq !== undefined && { confirmedPrescribedActivityGbq: dto.confirmedPrescribedActivityGbq }),
          ...(dto.prescribedActivityOverrideReason !== undefined && { prescribedActivityOverrideReason: dto.prescribedActivityOverrideReason }),
          ...(dto.particleDensityCalc !== undefined && { particleDensityCalc: dto.particleDensityCalc }),
          ...(dto.lockStatus !== undefined && { lockStatus: dto.lockStatus as never }),
          updatedById: currentUser.id,
          version: { increment: 1 },
        },
      });
      if (result.count === 0) {
        const current = await tx.dosimetryPlan.findUnique({ where: { id }, select: { version: true, deletedAt: true, approvedAt: true } });
        if (!current || current.deletedAt !== null) throwNotFound('DosimetryPlan', id);
        if (current.approvedAt !== null) throw new ApiException(HttpStatus.CONFLICT, 'RECORD_LOCKED', 'This dosimetry plan was approved by another user.', { entityId: id });
        throwOptimisticLockConflict({ entityType: 'DosimetryPlan', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
      }
      const fresh = await tx.dosimetryPlan.findUnique({ where: { id } });
      if (!fresh) throwNotFound('DosimetryPlan', id);
      await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'DosimetryPlan', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role as Role, beforeSnapshot: existing as unknown as Record<string, unknown>, afterSnapshot: fresh as unknown as Record<string, unknown>, changedFields: buildChangedFields(existing as unknown as Record<string, unknown>, fresh as unknown as Record<string, unknown>, dto as unknown as Record<string, unknown>), ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
      return fresh;
    });
    return toDto(updated);
  }

  async approve(id: string, currentUser: UserResponseDto, request: Request) {
    const existing = await this.prisma.dosimetryPlan.findUnique({ where: { id } });
    if (!existing) throwNotFound('DosimetryPlan', id);
    return this.prisma.withinTransaction(async (tx) => {
      const result = await tx.dosimetryPlan.updateMany({
        where: { id, approvedAt: null, deletedAt: null },
        data: { approvedAt: new Date(), approvedById: currentUser.id, lockStatus: 'LOCKED', updatedById: currentUser.id, version: { increment: 1 } },
      });
      if (result.count === 0) {
        const current = await tx.dosimetryPlan.findUnique({ where: { id } });
        if (!current || current.deletedAt !== null) throwNotFound('DosimetryPlan', id);
        if (current.approvedAt !== null) return alreadyInState(toDto(current));
        throw new ApiException(HttpStatus.CONFLICT, 'INVALID_STATE_TRANSITION', 'Cannot approve this dosimetry plan.', { entityId: id });
      }
      const fresh = await tx.dosimetryPlan.findUnique({ where: { id } });
      if (!fresh) throwNotFound('DosimetryPlan', id);
      await this.auditService.logInTx(tx, { eventType: 'APPROVE', entityType: 'DosimetryPlan', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role as Role, beforeSnapshot: existing as unknown as Record<string, unknown>, afterSnapshot: fresh as unknown as Record<string, unknown>, changedFields: { approvedAt: { before: null, after: fresh.approvedAt } }, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
      return transitioned(toDto(fresh));
    });
  }

  async remove(id: string, version: number, currentUser: UserResponseDto, request: Request): Promise<void> {
    const existing = await this.prisma.dosimetryPlan.findUnique({ where: { id } });
    if (!existing) throwNotFound('DosimetryPlan', id);
    await this.prisma.withinTransaction(async (tx) => {
      const result = await tx.dosimetryPlan.updateMany({ where: { id, version, deletedAt: null }, data: { deletedAt: new Date(), updatedById: currentUser.id, version: { increment: 1 } } });
      if (result.count === 0) {
        const current = await tx.dosimetryPlan.findUnique({ where: { id }, select: { version: true, deletedAt: true } });
        if (!current || current.deletedAt !== null) throwNotFound('DosimetryPlan', id);
        throwOptimisticLockConflict({ entityType: 'DosimetryPlan', entityId: id, submittedVersion: version, currentVersion: current.version });
      }
      await this.auditService.logInTx(tx, { eventType: 'DELETE', entityType: 'DosimetryPlan', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role as Role, beforeSnapshot: existing as unknown as Record<string, unknown>, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
    });
  }
}
