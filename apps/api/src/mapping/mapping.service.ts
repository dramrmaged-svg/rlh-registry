import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService, type PrismaTx } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateMappingSessionDto } from './dto/create-mapping-session.dto';
import { PatchMappingSessionDto } from './dto/patch-mapping-session.dto';
import { MappingSessionDto } from './dto/mapping-session.dto';
import { CreateMaaStudyDto } from './dto/create-maa-study.dto';
import { MaaStudyDto } from './dto/maa-study.dto';
import type { UserResponseDto } from '../users/dto/user-response.dto';
import type { Role } from '@prisma/client';
import type { Request } from 'express';
import { throwNotFound, throwOptimisticLockConflict } from '../common/helpers/conflict.helper';
import { buildChangedFields } from '../common/helpers/changed-fields.helper';
import { serializeDecimals } from '../common/helpers/decimal.helper';
import { calculateLungShuntRiskBand, recordCalculationAudit, LUNG_SHUNT_FORMULA_VERSION } from '../calculations';

function toSessionDto(record: Record<string, unknown>): MappingSessionDto {
  return plainToInstance(MappingSessionDto, serializeDecimals(record), { excludeExtraneousValues: true });
}
function toMaaDto(record: Record<string, unknown>): MaaStudyDto {
  return plainToInstance(MaaStudyDto, serializeDecimals(record), { excludeExtraneousValues: true });
}

@Injectable()
export class MappingService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async listForEpisode(episodeId: string): Promise<MappingSessionDto[]> {
    const sessions = await this.prisma.mappingSession.findMany({ where: { episodeId }, orderBy: { sessionDate: 'asc' } });
    return sessions.map(toSessionDto);
  }

  async getById(id: string): Promise<MappingSessionDto> {
    const session = await this.prisma.mappingSession.findUnique({ where: { id } });
    if (!session) throwNotFound('MappingSession', id);
    return toSessionDto(session);
  }

  async create(episodeId: string, dto: CreateMappingSessionDto, currentUser: UserResponseDto, request: Request): Promise<MappingSessionDto> {
    const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
    if (!episode) throwNotFound('Episode', episodeId);
    const created = await this.prisma.withinTransaction(async (tx) => {
      const session = await tx.mappingSession.create({
        data: {
          episodeId,
          sessionDate: new Date(dto.sessionDate),
          status: dto.status ?? null,
          accessRoute: dto.accessRoute ?? null,
          accessSite: dto.accessSite ?? null,
          catheterType: dto.catheterType ?? null,
          fluoroTimeMin: dto.fluoroTimeMin ?? null,
          dapGyCm2: dto.dapGyCm2 ?? null,
          contrastVolumeMl: dto.contrastVolumeMl ?? null,
          michelsAnatomy: dto.michelsAnatomy ?? null,
          embolicMaterial: dto.embolicMaterial ?? null,
          complications: dto.complications ?? null,
          operatorUserId: dto.operatorUserId ?? null,
          createdById: currentUser.id,
          updatedById: currentUser.id,
        },
      });
      await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'MappingSession', entityId: session.id, userId: currentUser.id, roleAtTime: currentUser.role as Role, afterSnapshot: session as unknown as Record<string, unknown>, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
      return session;
    }, 'serializable');
    return toSessionDto(created);
  }

  async patch(id: string, dto: PatchMappingSessionDto, currentUser: UserResponseDto, request: Request): Promise<MappingSessionDto> {
    const existing = await this.prisma.mappingSession.findUnique({ where: { id } });
    if (!existing) throwNotFound('MappingSession', id);
    const updated = await this.prisma.withinTransaction(async (tx) => {
      const result = await tx.mappingSession.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          ...(dto.sessionDate !== undefined && { sessionDate: new Date(dto.sessionDate) }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.accessRoute !== undefined && { accessRoute: dto.accessRoute }),
          ...(dto.accessSite !== undefined && { accessSite: dto.accessSite }),
          ...(dto.catheterType !== undefined && { catheterType: dto.catheterType }),
          ...(dto.fluoroTimeMin !== undefined && { fluoroTimeMin: dto.fluoroTimeMin }),
          ...(dto.dapGyCm2 !== undefined && { dapGyCm2: dto.dapGyCm2 }),
          ...(dto.contrastVolumeMl !== undefined && { contrastVolumeMl: dto.contrastVolumeMl }),
          ...(dto.michelsAnatomy !== undefined && { michelsAnatomy: dto.michelsAnatomy }),
          ...(dto.embolicMaterial !== undefined && { embolicMaterial: dto.embolicMaterial }),
          ...(dto.complications !== undefined && { complications: dto.complications }),
          ...(dto.operatorUserId !== undefined && { operatorUserId: dto.operatorUserId }),
          ...(dto.lockStatus !== undefined && { lockStatus: dto.lockStatus as never }),
          updatedById: currentUser.id,
          version: { increment: 1 },
        },
      });
      if (result.count === 0) {
        const current = await tx.mappingSession.findUnique({ where: { id }, select: { version: true, deletedAt: true } });
        if (!current || current.deletedAt !== null) throwNotFound('MappingSession', id);
        throwOptimisticLockConflict({ entityType: 'MappingSession', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
      }
      const fresh = await tx.mappingSession.findUnique({ where: { id } });
      if (!fresh) throwNotFound('MappingSession', id);
      await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'MappingSession', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role as Role, beforeSnapshot: existing as unknown as Record<string, unknown>, afterSnapshot: fresh as unknown as Record<string, unknown>, changedFields: buildChangedFields(existing as unknown as Record<string, unknown>, fresh as unknown as Record<string, unknown>, dto as unknown as Record<string, unknown>), ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
      return fresh;
    });
    return toSessionDto(updated);
  }

  async remove(id: string, version: number, currentUser: UserResponseDto, request: Request): Promise<void> {
    const existing = await this.prisma.mappingSession.findUnique({ where: { id } });
    if (!existing) throwNotFound('MappingSession', id);
    await this.prisma.withinTransaction(async (tx) => {
      const result = await tx.mappingSession.updateMany({ where: { id, version, deletedAt: null }, data: { deletedAt: new Date(), updatedById: currentUser.id, version: { increment: 1 } } });
      if (result.count === 0) {
        const current = await tx.mappingSession.findUnique({ where: { id }, select: { version: true, deletedAt: true } });
        if (!current || current.deletedAt !== null) throwNotFound('MappingSession', id);
        throwOptimisticLockConflict({ entityType: 'MappingSession', entityId: id, submittedVersion: version, currentVersion: current.version });
      }
      await this.auditService.logInTx(tx, { eventType: 'DELETE', entityType: 'MappingSession', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role as Role, beforeSnapshot: existing as unknown as Record<string, unknown>, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
    });
  }

  async listMaaStudies(mappingSessionId: string): Promise<MaaStudyDto[]> {
    const studies = await this.prisma.maaStudy.findMany({ where: { mappingSessionId }, orderBy: { studyDate: 'asc' } });
    return studies.map(toMaaDto);
  }

  /** LSF risk band is computed server-side from lungShuntFraction via the Phase 1 calculation engine — never client-supplied. */
  async createMaaStudy(mappingSessionId: string, dto: CreateMaaStudyDto, currentUser: UserResponseDto, request: Request): Promise<MaaStudyDto> {
    const session = await this.prisma.mappingSession.findUnique({ where: { id: mappingSessionId } });
    if (!session) throwNotFound('MappingSession', mappingSessionId);
    const riskBand = calculateLungShuntRiskBand({ lungShuntFractionPercent: dto.lungShuntFraction });

    const created = await this.prisma.withinTransaction(async (tx: PrismaTx) => {
      const maaStudy = await tx.maaStudy.create({
        data: {
          mappingSessionId,
          studyDate: new Date(dto.studyDate),
          injectedActivityMbq: dto.injectedActivityMbq ?? null,
          lungShuntFraction: dto.lungShuntFraction ?? null,
          calculatedLsfRiskBand: riskBand.status === 'CALCULATED' ? riskBand.value : null,
          extrahepaticUptake: dto.extrahepaticUptake ?? null,
          extrahepaticUptakeSites: dto.extrahepaticUptakeSites ?? null,
          maaDistributionMatchesTarget: dto.maaDistributionMatchesTarget ?? null,
          balanceCheckPass: dto.balanceCheckPass ?? null,
          calculationVersion: LUNG_SHUNT_FORMULA_VERSION,
          createdById: currentUser.id,
        },
      });
      await recordCalculationAudit(tx, { entityType: 'MaaStudy', entityId: maaStudy.id, formulaId: 'LUNG_SHUNT_RISK_BAND', result: riskBand, inputsSnapshot: { lungShuntFractionPercent: dto.lungShuntFraction }, calculatedById: currentUser.id });
      await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'MaaStudy', entityId: maaStudy.id, userId: currentUser.id, roleAtTime: currentUser.role as Role, afterSnapshot: maaStudy as unknown as Record<string, unknown>, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
      return maaStudy;
    });
    return toMaaDto(created);
  }
}
