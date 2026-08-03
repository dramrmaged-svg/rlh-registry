import { Injectable, HttpStatus } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { PatchFollowUpDto } from './dto/patch-follow-up.dto';
import { FollowUpDto } from './dto/follow-up.dto';
import type { UserResponseDto } from '../users/dto/user-response.dto';
import type { Role } from '@prisma/client';
import type { Request } from 'express';
import { ApiException } from '../common/filters/global-exception.filter';
import { throwNotFound, throwOptimisticLockConflict } from '../common/helpers/conflict.helper';
import { buildChangedFields } from '../common/helpers/changed-fields.helper';

function toDto(record: Record<string, unknown>): FollowUpDto {
  return plainToInstance(FollowUpDto, record, { excludeExtraneousValues: true });
}

@Injectable()
export class FollowUpService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async listForEpisode(episodeId: string): Promise<FollowUpDto[]> {
    const followUps = await this.prisma.followUp.findMany({ where: { episodeId }, orderBy: { followUpDate: 'asc' } });
    return followUps.map(toDto);
  }

  async getById(id: string): Promise<FollowUpDto> {
    const followUp = await this.prisma.followUp.findUnique({ where: { id } });
    if (!followUp) throwNotFound('FollowUp', id);
    return toDto(followUp);
  }

  async create(episodeId: string, dto: CreateFollowUpDto, currentUser: UserResponseDto, request: Request): Promise<FollowUpDto> {
    const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
    if (!episode) throwNotFound('Episode', episodeId);
    if (dto.lesionId) {
      const lesion = await this.prisma.lesion.findUnique({ where: { id: dto.lesionId } });
      if (!lesion || lesion.deletedAt !== null || lesion.episodeId !== episodeId) {
        throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, 'LESION_EPISODE_MISMATCH', 'lesionId must reference a lesion belonging to the same episode.', { lesionId: dto.lesionId, episodeId });
      }
    }
    const created = await this.prisma.withinTransaction(async (tx) => {
      const followUp = await tx.followUp.create({
        data: {
          episodeId,
          lesionId: dto.lesionId ?? null,
          followUpDate: new Date(dto.followUpDate),
          intendedTimepoint: dto.intendedTimepoint ?? null,
          intervalMonths: dto.intervalMonths ?? null,
          visitType: dto.visitType ?? null,
          overallResponse: dto.overallResponse ?? null,
          createdById: currentUser.id,
          updatedById: currentUser.id,
        },
      });
      await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'FollowUp', entityId: followUp.id, userId: currentUser.id, roleAtTime: currentUser.role as Role, afterSnapshot: followUp as unknown as Record<string, unknown>, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
      return followUp;
    }, 'serializable');
    return toDto(created);
  }

  async patch(id: string, dto: PatchFollowUpDto, currentUser: UserResponseDto, request: Request): Promise<FollowUpDto> {
    const existing = await this.prisma.followUp.findUnique({ where: { id } });
    if (!existing) throwNotFound('FollowUp', id);
    const updated = await this.prisma.withinTransaction(async (tx) => {
      const result = await tx.followUp.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          ...(dto.lesionId !== undefined && { lesionId: dto.lesionId }),
          ...(dto.followUpDate !== undefined && { followUpDate: new Date(dto.followUpDate) }),
          ...(dto.intendedTimepoint !== undefined && { intendedTimepoint: dto.intendedTimepoint }),
          ...(dto.intervalMonths !== undefined && { intervalMonths: dto.intervalMonths }),
          ...(dto.visitType !== undefined && { visitType: dto.visitType }),
          ...(dto.overallResponse !== undefined && { overallResponse: dto.overallResponse }),
          ...(dto.lockStatus !== undefined && { lockStatus: dto.lockStatus as never }),
          updatedById: currentUser.id,
          version: { increment: 1 },
        },
      });
      if (result.count === 0) {
        const current = await tx.followUp.findUnique({ where: { id }, select: { version: true, deletedAt: true } });
        if (!current || current.deletedAt !== null) throwNotFound('FollowUp', id);
        throwOptimisticLockConflict({ entityType: 'FollowUp', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
      }
      const fresh = await tx.followUp.findUnique({ where: { id } });
      if (!fresh) throwNotFound('FollowUp', id);
      await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'FollowUp', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role as Role, beforeSnapshot: existing as unknown as Record<string, unknown>, afterSnapshot: fresh as unknown as Record<string, unknown>, changedFields: buildChangedFields(existing as unknown as Record<string, unknown>, fresh as unknown as Record<string, unknown>, dto as unknown as Record<string, unknown>), ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
      return fresh;
    });
    return toDto(updated);
  }

  async remove(id: string, version: number, currentUser: UserResponseDto, request: Request): Promise<void> {
    const existing = await this.prisma.followUp.findUnique({ where: { id } });
    if (!existing) throwNotFound('FollowUp', id);
    await this.prisma.withinTransaction(async (tx) => {
      const result = await tx.followUp.updateMany({ where: { id, version, deletedAt: null }, data: { deletedAt: new Date(), updatedById: currentUser.id, version: { increment: 1 } } });
      if (result.count === 0) {
        const current = await tx.followUp.findUnique({ where: { id }, select: { version: true, deletedAt: true } });
        if (!current || current.deletedAt !== null) throwNotFound('FollowUp', id);
        throwOptimisticLockConflict({ entityType: 'FollowUp', entityId: id, submittedVersion: version, currentVersion: current.version });
      }
      await this.auditService.logInTx(tx, { eventType: 'DELETE', entityType: 'FollowUp', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role as Role, beforeSnapshot: existing as unknown as Record<string, unknown>, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
    });
  }
}
