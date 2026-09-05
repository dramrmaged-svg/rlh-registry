import { Injectable, ForbiddenException, BadRequestException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService, type PrismaTx } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PatchMdtRecordDto } from './dto/patch-mdt-record.dto';
import { CreateMdtRecordDto } from './dto/create-mdt-record.dto';
import { MdtRecordDto } from './dto/mdt-record.dto';
import type { UserResponseDto } from '../users/dto/user-response.dto';
import type { Role } from '@prisma/client';
import type { Request } from 'express';
import { ApiException } from '../common/filters/global-exception.filter';
import { throwNotFound, throwOptimisticLockConflict } from '../common/helpers/conflict.helper';
import { alreadyInState, transitioned } from '../common/types/action-response.type';
import { buildChangedFields } from '../common/helpers/changed-fields.helper';

type LockAction = 'submit' | 'lock' | 'unlock';
type RecordLockStatus = 'DRAFT' | 'SUBMITTED' | 'LOCKED';

function computeMdtAvailableActions(lockStatus: string, role: string): LockAction[] {
  const isConsultantOrAdmin = role === 'ADMIN' || role === 'CONSULTANT_IR';
  const isAdmin = role === 'ADMIN';
  switch (lockStatus as RecordLockStatus) {
    case 'DRAFT': return ['submit'];
    case 'SUBMITTED': return [...(isConsultantOrAdmin ? ['lock' as LockAction] : []), ...(isAdmin ? ['unlock' as LockAction] : [])];
    case 'LOCKED': return isAdmin ? ['unlock'] : [];
    default: return [];
  }
}

const MDT_RECORD_QUERY = {
  include: {
    mdtSession: { select: { id: true, sessionDate: true, location: true, chair: true } },
    clinicalSnapshot: { include: { labPanel: { select: { collectedAt: true } }, clinicalScore: { select: { scoreDate: true } } } },
    lockedBy: { select: { id: true, firstName: true, lastName: true, title: true } },
  },
} as const;

type RawMdtRecord = Prisma.MdtRecordGetPayload<typeof MDT_RECORD_QUERY>;

function toMdtRecordDto(record: RawMdtRecord, callerRole: string): MdtRecordDto {
  const snapshot = record.clinicalSnapshot ? { ...record.clinicalSnapshot, labPanelCollectedAt: record.clinicalSnapshot.labPanel?.collectedAt ?? null, clinicalScoreDate: record.clinicalSnapshot.clinicalScore?.scoreDate ?? null } : null;
  return plainToInstance(MdtRecordDto, { ...record, clinicalSnapshot: snapshot, availableActions: computeMdtAvailableActions(record.lockStatus, callerRole) }, { excludeExtraneousValues: true });
}

async function reReadOrThrow(tx: PrismaTx, id: string): Promise<RawMdtRecord> {
  const current = await tx.mdtRecord.findUnique({ where: { id }, ...MDT_RECORD_QUERY });
  if (current === null || current.deletedAt !== null) throwNotFound('MdtRecord', id);
  return current;
}

@Injectable()
export class MdtService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async listForEpisode(episodeId: string, callerRole: string): Promise<MdtRecordDto[]> {
    const records = await this.prisma.mdtRecord.findMany({ where: { episodeId }, ...MDT_RECORD_QUERY, orderBy: { createdAt: 'desc' } });
    return records.map((r) => toMdtRecordDto(r, callerRole));
  }

  async getRecord(id: string, callerRole: string): Promise<MdtRecordDto> {
    const record = await this.prisma.mdtRecord.findUnique({ where: { id }, ...MDT_RECORD_QUERY });
    if (!record) throwNotFound('MdtRecord', id);
    return toMdtRecordDto(record, callerRole);
  }

  async create(episodeId: string, dto: CreateMdtRecordDto, currentUser: UserResponseDto, request: Request): Promise<MdtRecordDto> {
    const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
    if (!episode) throwNotFound('Episode', episodeId);
    const session = await this.prisma.mdtSession.findUnique({ where: { id: dto.mdtSessionId } });
    if (!session) throwNotFound('MdtSession', dto.mdtSessionId);
    try {
      const record = await this.prisma.withinTransaction(async (tx) => {
        const latestScore = await tx.clinicalScore.findFirst({ where: { episodeId }, orderBy: { scoreDate: 'desc' } });
        const latestLab = await tx.labPanel.findFirst({ where: { episodeId, submittedAt: { not: null } }, orderBy: { collectedAt: 'desc' } });
        let snapshotId: string | null = null;
        if (latestScore) {
          const snapshot = await tx.clinicalSnapshot.create({ data: { episodeId, snapshotDate: new Date(), snapshotContext: 'MDT_REVIEW', clinicalScoreId: latestScore.id, labPanelId: latestLab?.id ?? null, ecogScore: latestScore.ecogScore, cpGrade: latestScore.cpGrade, cpTotalScore: latestScore.cpTotalScore, meld3Score: latestScore.meld3Score, meldNaScore: latestScore.meldNaScore, meldNaScoreRounded: latestScore.meldNaScoreRounded, albiGrade: latestScore.albiGrade, albiScore: latestScore.albiScore, bclcStage: latestScore.bclcStage, bsaM2: latestScore.bsaM2, weightKg: latestScore.weightKg, calculationVersion: latestScore.calculationVersion, createdById: currentUser.id } });
          snapshotId = snapshot.id;
        }
        const created = await tx.mdtRecord.create({ data: { episodeId, mdtSessionId: dto.mdtSessionId, clinicalSnapshotId: snapshotId, diseaseSummary: dto.diseaseSummary ?? null, priorTreatmentSummary: dto.priorTreatmentSummary ?? null, decision: dto.decision as never ?? null, decisionDetail: dto.decisionDetail ?? null, decisionConditions: dto.decisionConditions ?? null, patientFitForProcedure: dto.patientFitForProcedure ?? null, performanceStatusAcceptable: dto.performanceStatusAcceptable ?? null, liverFunctionAcceptable: dto.liverFunctionAcceptable ?? null, tumourLoadAcceptable: dto.tumourLoadAcceptable ?? null, lockStatus: 'DRAFT', createdById: currentUser.id, updatedById: currentUser.id } });
        await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'MdtRecord', entityId: created.id, userId: currentUser.id, roleAtTime: currentUser.role as Role, afterSnapshot: created as unknown as Record<string, unknown>, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
        return created;
      }, 'read-committed');
      const fresh = await this.prisma.mdtRecord.findUnique({ where: { id: record.id }, ...MDT_RECORD_QUERY });
      if (!fresh) throwNotFound('MdtRecord', record.id);
      return toMdtRecordDto(fresh, currentUser.role);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') throw new ApiException(HttpStatus.CONFLICT, 'DUPLICATE_MDT_RECORD', 'An MDT record already exists for this episode and session.', { episodeId, mdtSessionId: dto.mdtSessionId });
      throw err;
    }
  }

  async patch(id: string, dto: PatchMdtRecordDto, currentUser: UserResponseDto, request: Request): Promise<MdtRecordDto> {
    const existing = await this.prisma.mdtRecord.findUnique({ where: { id }, ...MDT_RECORD_QUERY });
    if (!existing) throwNotFound('MdtRecord', id);
    if (existing.lockStatus === 'LOCKED') throw new ForbiddenException({ code: 'RECORD_LOCKED', message: 'This MDT record is finalized.' });
    if (existing.lockStatus === 'SUBMITTED' && currentUser.role !== 'ADMIN' && currentUser.role !== 'CONSULTANT_IR') throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Only Consultants can edit a submitted MDT record.' });
    const updated = await this.prisma.withinTransaction(async (tx) => {
      const result = await tx.mdtRecord.updateMany({ where: { id, version: dto.version, lockStatus: { not: 'LOCKED' }, deletedAt: null }, data: { ...(dto.diseaseSummary !== undefined && { diseaseSummary: dto.diseaseSummary }), ...(dto.priorTreatmentSummary !== undefined && { priorTreatmentSummary: dto.priorTreatmentSummary }), ...(dto.decision !== undefined && { decision: dto.decision as never }), ...(dto.decisionDetail !== undefined && { decisionDetail: dto.decisionDetail }), ...(dto.decisionConditions !== undefined && { decisionConditions: dto.decisionConditions }), ...(dto.patientFitForProcedure !== undefined && { patientFitForProcedure: dto.patientFitForProcedure }), ...(dto.performanceStatusAcceptable !== undefined && { performanceStatusAcceptable: dto.performanceStatusAcceptable }), ...(dto.liverFunctionAcceptable !== undefined && { liverFunctionAcceptable: dto.liverFunctionAcceptable }), ...(dto.tumourLoadAcceptable !== undefined && { tumourLoadAcceptable: dto.tumourLoadAcceptable }), updatedById: currentUser.id, version: { increment: 1 } } });
      if (result.count === 0) {
        const current = await tx.mdtRecord.findUnique({ where: { id }, select: { version: true, lockStatus: true, deletedAt: true } });
        if (current !== null && current.deletedAt !== null) throwNotFound('MdtRecord', id);
        if (current === null) throwNotFound('MdtRecord', id);
        if (current.lockStatus === 'LOCKED') throw new ForbiddenException({ code: 'RECORD_LOCKED', message: 'This record was locked by a concurrent request.' });
        throwOptimisticLockConflict({ entityType: 'MdtRecord', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
      }
      const fresh = await tx.mdtRecord.findUnique({ where: { id }, ...MDT_RECORD_QUERY });
      if (!fresh) throwNotFound('MdtRecord', id);
      await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'MdtRecord', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role as Role, beforeSnapshot: existing as unknown as Record<string, unknown>, afterSnapshot: fresh as unknown as Record<string, unknown>, changedFields: buildChangedFields(existing as unknown as Record<string, unknown>, fresh as unknown as Record<string, unknown>, dto as unknown as Record<string, unknown>), ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
      return fresh;
    });
    return toMdtRecordDto(updated, currentUser.role);
  }

  async submit(id: string, currentUser: UserResponseDto, request: Request) {
    const existing = await this.prisma.mdtRecord.findUnique({ where: { id }, ...MDT_RECORD_QUERY });
    if (!existing) throwNotFound('MdtRecord', id);
    return this.prisma.withinTransaction(async (tx) => {
      const result = await tx.mdtRecord.updateMany({ where: { id, lockStatus: 'DRAFT', deletedAt: null }, data: { lockStatus: 'SUBMITTED', submittedAt: new Date(), submittedById: currentUser.id, updatedById: currentUser.id } });
      if (result.count === 0) {
        const current = await reReadOrThrow(tx, id);
        if (current.lockStatus === 'SUBMITTED') return alreadyInState(toMdtRecordDto(current, currentUser.role));
        throw new ApiException(HttpStatus.CONFLICT, 'INVALID_STATE_TRANSITION', `Cannot submit: current status is '${current.lockStatus}'`, { entityId: id });
      }
      const fresh = await tx.mdtRecord.findUnique({ where: { id }, ...MDT_RECORD_QUERY });
      if (!fresh) throwNotFound('MdtRecord', id);
      await this.auditService.logInTx(tx, { eventType: 'SUBMIT', entityType: 'MdtRecord', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role as Role, beforeSnapshot: existing as unknown as Record<string, unknown>, afterSnapshot: fresh as unknown as Record<string, unknown>, changedFields: { lockStatus: { before: existing.lockStatus, after: 'SUBMITTED' } }, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
      return transitioned(toMdtRecordDto(fresh, currentUser.role));
    });
  }

  async lock(id: string, currentUser: UserResponseDto, request: Request) {
    const existing = await this.prisma.mdtRecord.findUnique({ where: { id }, ...MDT_RECORD_QUERY });
    if (!existing) throwNotFound('MdtRecord', id);
    return this.prisma.withinTransaction(async (tx) => {
      const result = await tx.mdtRecord.updateMany({ where: { id, lockStatus: 'SUBMITTED', deletedAt: null }, data: { lockStatus: 'LOCKED', lockedAt: new Date(), lockedById: currentUser.id, updatedById: currentUser.id } });
      if (result.count === 0) {
        const current = await reReadOrThrow(tx, id);
        if (current.lockStatus === 'LOCKED') return alreadyInState(toMdtRecordDto(current, currentUser.role));
        throw new ApiException(HttpStatus.CONFLICT, 'INVALID_STATE_TRANSITION', `Cannot lock: current status is '${current.lockStatus}'`, { entityId: id });
      }
      const fresh = await tx.mdtRecord.findUnique({ where: { id }, ...MDT_RECORD_QUERY });
      if (!fresh) throwNotFound('MdtRecord', id);
      await this.auditService.logInTx(tx, { eventType: 'LOCK', entityType: 'MdtRecord', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role as Role, beforeSnapshot: existing as unknown as Record<string, unknown>, afterSnapshot: fresh as unknown as Record<string, unknown>, changedFields: { lockStatus: { before: existing.lockStatus, after: 'LOCKED' } }, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
      return transitioned(toMdtRecordDto(fresh, currentUser.role));
    });
  }

  async unlock(id: string, reason: string, currentUser: UserResponseDto, request: Request) {
    if (!reason || reason.trim().length < 10) throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Unlock reason must be at least 10 characters.' });
    const existing = await this.prisma.mdtRecord.findUnique({ where: { id }, ...MDT_RECORD_QUERY });
    if (!existing) throwNotFound('MdtRecord', id);
    return this.prisma.withinTransaction(async (tx) => {
      const result = await tx.mdtRecord.updateMany({ where: { id, lockStatus: 'LOCKED', deletedAt: null }, data: { lockStatus: 'SUBMITTED', lockedAt: null, lockedById: null, updatedById: currentUser.id } });
      if (result.count === 0) {
        const current = await reReadOrThrow(tx, id);
        if (current.lockStatus === 'SUBMITTED' || current.lockStatus === 'DRAFT') return alreadyInState(toMdtRecordDto(current, currentUser.role));
        throw new ApiException(HttpStatus.CONFLICT, 'INVALID_STATE_TRANSITION', `Cannot unlock: current status is '${current.lockStatus}'`, { entityId: id });
      }
      const fresh = await tx.mdtRecord.findUnique({ where: { id }, ...MDT_RECORD_QUERY });
      if (!fresh) throwNotFound('MdtRecord', id);
      await this.auditService.logInTx(tx, { eventType: 'UNLOCK', entityType: 'MdtRecord', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role as Role, beforeSnapshot: existing as unknown as Record<string, unknown>, afterSnapshot: fresh as unknown as Record<string, unknown>, changedFields: { lockStatus: { before: 'LOCKED', after: 'SUBMITTED' } }, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: { overrideReason: reason } });
      return transitioned(toMdtRecordDto(fresh, currentUser.role));
    });
  }
}
