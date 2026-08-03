import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService, type PrismaTx } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateLesionDto } from './dto/create-lesion.dto';
import { PatchLesionDto } from './dto/patch-lesion.dto';
import { LesionDto } from './dto/lesion.dto';
import type { UserResponseDto } from '../users/dto/user-response.dto';
import type { Role } from '@prisma/client';
import type { Request } from 'express';
import { throwNotFound, throwOptimisticLockConflict } from '../common/helpers/conflict.helper';
import { buildChangedFields } from '../common/helpers/changed-fields.helper';
import { serializeDecimals } from '../common/helpers/decimal.helper';

function toDto(record: Record<string, unknown>): LesionDto {
  return plainToInstance(LesionDto, serializeDecimals(record), { excludeExtraneousValues: true });
}

async function nextLesionNumber(tx: PrismaTx, episodeId: string): Promise<number> {
  const aggregate = await tx.lesion.aggregate({ where: { episodeId }, _max: { lesionNumber: true } });
  return (aggregate._max.lesionNumber ?? 0) + 1;
}

@Injectable()
export class LesionsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async listForEpisode(episodeId: string): Promise<LesionDto[]> {
    const lesions = await this.prisma.lesion.findMany({ where: { episodeId }, orderBy: { lesionNumber: 'asc' } });
    return lesions.map(toDto);
  }

  async getById(id: string): Promise<LesionDto> {
    const lesion = await this.prisma.lesion.findUnique({ where: { id } });
    if (!lesion) throwNotFound('Lesion', id);
    return toDto(lesion);
  }

  async create(episodeId: string, dto: CreateLesionDto, currentUser: UserResponseDto, request: Request): Promise<LesionDto> {
    const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
    if (!episode) throwNotFound('Episode', episodeId);
    const created = await this.prisma.withinTransaction(async (tx) => {
      const lesionNumber = dto.lesionNumber ?? (await nextLesionNumber(tx, episodeId));
      const lesion = await tx.lesion.create({
        data: {
          episodeId,
          lesionNumber,
          segment: dto.segment ?? null,
          laterality: dto.laterality ?? null,
          ...(dto.isTargetLesion !== undefined && { isTargetLesion: dto.isTargetLesion }),
          diameterAxialMm: dto.diameterAxialMm ?? null,
          diameterCraniocaudalMm: dto.diameterCraniocaudalMm ?? null,
          diameterApMm: dto.diameterApMm ?? null,
          lirads: dto.lirads ?? null,
          notes: dto.notes ?? null,
          createdById: currentUser.id,
          updatedById: currentUser.id,
        },
      });
      await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'Lesion', entityId: lesion.id, userId: currentUser.id, roleAtTime: currentUser.role as Role, afterSnapshot: lesion as unknown as Record<string, unknown>, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
      return lesion;
    }, 'serializable');
    return toDto(created);
  }

  async patch(id: string, dto: PatchLesionDto, currentUser: UserResponseDto, request: Request): Promise<LesionDto> {
    const existing = await this.prisma.lesion.findUnique({ where: { id } });
    if (!existing) throwNotFound('Lesion', id);
    const updated = await this.prisma.withinTransaction(async (tx) => {
      const result = await tx.lesion.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          ...(dto.segment !== undefined && { segment: dto.segment }),
          ...(dto.laterality !== undefined && { laterality: dto.laterality }),
          ...(dto.isTargetLesion !== undefined && { isTargetLesion: dto.isTargetLesion }),
          ...(dto.diameterAxialMm !== undefined && { diameterAxialMm: dto.diameterAxialMm }),
          ...(dto.diameterCraniocaudalMm !== undefined && { diameterCraniocaudalMm: dto.diameterCraniocaudalMm }),
          ...(dto.diameterApMm !== undefined && { diameterApMm: dto.diameterApMm }),
          ...(dto.lirads !== undefined && { lirads: dto.lirads }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
          updatedById: currentUser.id,
          version: { increment: 1 },
        },
      });
      if (result.count === 0) {
        const current = await tx.lesion.findUnique({ where: { id }, select: { version: true, deletedAt: true } });
        if (!current || current.deletedAt !== null) throwNotFound('Lesion', id);
        throwOptimisticLockConflict({ entityType: 'Lesion', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
      }
      const fresh = await tx.lesion.findUnique({ where: { id } });
      if (!fresh) throwNotFound('Lesion', id);
      await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'Lesion', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role as Role, beforeSnapshot: existing as unknown as Record<string, unknown>, afterSnapshot: fresh as unknown as Record<string, unknown>, changedFields: buildChangedFields(existing as unknown as Record<string, unknown>, fresh as unknown as Record<string, unknown>, dto as unknown as Record<string, unknown>), ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
      return fresh;
    });
    return toDto(updated);
  }

  async remove(id: string, version: number, currentUser: UserResponseDto, request: Request): Promise<void> {
    const existing = await this.prisma.lesion.findUnique({ where: { id } });
    if (!existing) throwNotFound('Lesion', id);
    await this.prisma.withinTransaction(async (tx) => {
      const result = await tx.lesion.updateMany({ where: { id, version, deletedAt: null }, data: { deletedAt: new Date(), updatedById: currentUser.id, version: { increment: 1 } } });
      if (result.count === 0) {
        const current = await tx.lesion.findUnique({ where: { id }, select: { version: true, deletedAt: true } });
        if (!current || current.deletedAt !== null) throwNotFound('Lesion', id);
        throwOptimisticLockConflict({ entityType: 'Lesion', entityId: id, submittedVersion: version, currentVersion: current.version });
      }
      await this.auditService.logInTx(tx, { eventType: 'DELETE', entityType: 'Lesion', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role as Role, beforeSnapshot: existing as unknown as Record<string, unknown>, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
    });
  }
}
