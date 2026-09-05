import { Injectable, HttpStatus } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateToxicityEventDto } from './dto/create-toxicity-event.dto';
import { PatchToxicityEventDto } from './dto/patch-toxicity-event.dto';
import { ToxicityEventDto } from './dto/toxicity-event.dto';
import type { UserResponseDto } from '../users/dto/user-response.dto';
import type { Role } from '@prisma/client';
import type { Request } from 'express';
import { ApiException } from '../common/filters/global-exception.filter';
import { throwNotFound, throwOptimisticLockConflict } from '../common/helpers/conflict.helper';
import { buildChangedFields } from '../common/helpers/changed-fields.helper';

function toDto(record: Record<string, unknown>): ToxicityEventDto {
  return plainToInstance(ToxicityEventDto, record, { excludeExtraneousValues: true });
}

@Injectable()
export class ToxicityService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async listForEpisode(episodeId: string): Promise<ToxicityEventDto[]> {
    const events = await this.prisma.toxicityEvent.findMany({ where: { episodeId }, orderBy: { createdAt: 'asc' } });
    return events.map(toDto);
  }

  async getById(id: string): Promise<ToxicityEventDto> {
    const event = await this.prisma.toxicityEvent.findUnique({ where: { id } });
    if (!event) throwNotFound('ToxicityEvent', id);
    return toDto(event);
  }

  async create(episodeId: string, dto: CreateToxicityEventDto, currentUser: UserResponseDto, request: Request): Promise<ToxicityEventDto> {
    const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
    if (!episode) throwNotFound('Episode', episodeId);
    if (dto.treatmentSessionId) {
      const session = await this.prisma.treatmentSession.findUnique({ where: { id: dto.treatmentSessionId } });
      if (!session || session.deletedAt !== null || session.episodeId !== episodeId) {
        throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, 'TREATMENT_SESSION_EPISODE_MISMATCH', 'treatmentSessionId must reference a treatment session belonging to the same episode.', { treatmentSessionId: dto.treatmentSessionId, episodeId });
      }
    }
    const created = await this.prisma.withinTransaction(async (tx) => {
      const event = await tx.toxicityEvent.create({
        data: {
          episodeId,
          treatmentSessionId: dto.treatmentSessionId ?? null,
          onsetDate: dto.onsetDate ? new Date(dto.onsetDate) : null,
          toxicityType: dto.toxicityType,
          ctcaeGrade: dto.ctcaeGrade ?? null,
          reildGrade: dto.reildGrade ?? null,
          outcome: dto.outcome ?? null,
          resolvedDate: dto.resolvedDate ? new Date(dto.resolvedDate) : null,
          notes: dto.notes ?? null,
          createdById: currentUser.id,
          updatedById: currentUser.id,
        },
      });
      await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'ToxicityEvent', entityId: event.id, userId: currentUser.id, roleAtTime: currentUser.role as Role, afterSnapshot: event as unknown as Record<string, unknown>, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
      return event;
    }, 'serializable');
    return toDto(created);
  }

  async patch(id: string, dto: PatchToxicityEventDto, currentUser: UserResponseDto, request: Request): Promise<ToxicityEventDto> {
    const existing = await this.prisma.toxicityEvent.findUnique({ where: { id } });
    if (!existing) throwNotFound('ToxicityEvent', id);
    const updated = await this.prisma.withinTransaction(async (tx) => {
      const result = await tx.toxicityEvent.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          ...(dto.treatmentSessionId !== undefined && { treatmentSessionId: dto.treatmentSessionId }),
          ...(dto.onsetDate !== undefined && { onsetDate: dto.onsetDate === null ? null : new Date(dto.onsetDate) }),
          ...(dto.toxicityType !== undefined && { toxicityType: dto.toxicityType }),
          ...(dto.ctcaeGrade !== undefined && { ctcaeGrade: dto.ctcaeGrade }),
          ...(dto.reildGrade !== undefined && { reildGrade: dto.reildGrade }),
          ...(dto.outcome !== undefined && { outcome: dto.outcome }),
          ...(dto.resolvedDate !== undefined && { resolvedDate: dto.resolvedDate === null ? null : new Date(dto.resolvedDate) }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
          ...(dto.lockStatus !== undefined && { lockStatus: dto.lockStatus as never }),
          updatedById: currentUser.id,
          version: { increment: 1 },
        },
      });
      if (result.count === 0) {
        const current = await tx.toxicityEvent.findUnique({ where: { id }, select: { version: true, deletedAt: true } });
        if (!current || current.deletedAt !== null) throwNotFound('ToxicityEvent', id);
        throwOptimisticLockConflict({ entityType: 'ToxicityEvent', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
      }
      const fresh = await tx.toxicityEvent.findUnique({ where: { id } });
      if (!fresh) throwNotFound('ToxicityEvent', id);
      await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'ToxicityEvent', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role as Role, beforeSnapshot: existing as unknown as Record<string, unknown>, afterSnapshot: fresh as unknown as Record<string, unknown>, changedFields: buildChangedFields(existing as unknown as Record<string, unknown>, fresh as unknown as Record<string, unknown>, dto as unknown as Record<string, unknown>), ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
      return fresh;
    });
    return toDto(updated);
  }

  async remove(id: string, version: number, currentUser: UserResponseDto, request: Request): Promise<void> {
    const existing = await this.prisma.toxicityEvent.findUnique({ where: { id } });
    if (!existing) throwNotFound('ToxicityEvent', id);
    await this.prisma.withinTransaction(async (tx) => {
      const result = await tx.toxicityEvent.updateMany({ where: { id, version, deletedAt: null }, data: { deletedAt: new Date(), updatedById: currentUser.id, version: { increment: 1 } } });
      if (result.count === 0) {
        const current = await tx.toxicityEvent.findUnique({ where: { id }, select: { version: true, deletedAt: true } });
        if (!current || current.deletedAt !== null) throwNotFound('ToxicityEvent', id);
        throwOptimisticLockConflict({ entityType: 'ToxicityEvent', entityId: id, submittedVersion: version, currentVersion: current.version });
      }
      await this.auditService.logInTx(tx, { eventType: 'DELETE', entityType: 'ToxicityEvent', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role as Role, beforeSnapshot: existing as unknown as Record<string, unknown>, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
    });
  }
}
