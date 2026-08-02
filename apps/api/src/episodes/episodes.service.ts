import { Injectable, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService, type PrismaTx } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { PatchEpisodeDto } from './dto/patch-episode.dto';
import { EpisodeTransitionDto } from './dto/episode-transition.dto';
import { ResumeEpisodeDto } from './dto/resume-episode.dto';
import { DuplicateEpisodeDto } from './dto/duplicate-episode.dto';
import { EpisodeSummaryDto } from './dto/episode-summary.dto';
import { EpisodeDetailDto } from './dto/episode-detail.dto';
import { EpisodeTimelineEventDto } from './dto/episode-timeline.dto';
import type { UserResponseDto } from '../users/dto/user-response.dto';
import type { Role } from '@prisma/client';
import type { Request } from 'express';
import { ApiException } from '../common/filters/global-exception.filter';
import { throwNotFound, throwOptimisticLockConflict } from '../common/helpers/conflict.helper';
import { alreadyInState, transitioned } from '../common/types/action-response.type';
import { buildChangedFields } from '../common/helpers/changed-fields.helper';
import {
  evaluateEpisodeStructuralReadiness,
  evaluateEpisodeCompletionReadiness,
  evaluateMdtApprovalReadiness,
  resolveReadinessFindings,
  type ReadinessFinding,
} from '../common/validation/episode-readiness-rules';
import { isValidEpisodeTransition, computeEpisodeAvailableActions, type EpisodeStatusValue } from './episode-status-transitions';

const EPISODE_QUERY = {
  include: {
    diagnosis: { select: { id: true, tumourType: true, aetiology: true, confirmedBclcStage: true, confirmedCpGrade: true } },
    _count: { select: { mdtRecords: true, lesions: true, mappingSessions: true, dosimetryPlans: true, treatmentSessions: true, followUps: true, toxicityEvents: true } },
  },
} as const;

type RawEpisode = Prisma.EpisodeGetPayload<typeof EPISODE_QUERY>;

function toSummaryDto(record: RawEpisode): EpisodeSummaryDto {
  return plainToInstance(
    EpisodeSummaryDto,
    { ...record, availableActions: computeEpisodeAvailableActions(record.status as EpisodeStatusValue) },
    { excludeExtraneousValues: true },
  );
}

function toDetailDto(record: RawEpisode): EpisodeDetailDto {
  return plainToInstance(
    EpisodeDetailDto,
    {
      ...record,
      availableActions: computeEpisodeAvailableActions(record.status as EpisodeStatusValue),
      completeness: {
        hasDiagnosis: record.diagnosis !== null,
        mdtRecordCount: record._count.mdtRecords,
        lesionCount: record._count.lesions,
        mappingSessionCount: record._count.mappingSessions,
        dosimetryPlanCount: record._count.dosimetryPlans,
        treatmentSessionCount: record._count.treatmentSessions,
        followUpCount: record._count.followUps,
        toxicityEventCount: record._count.toxicityEvents,
      },
    },
    { excludeExtraneousValues: true },
  );
}

async function reReadOrThrow(tx: PrismaTx, id: string): Promise<RawEpisode> {
  const current = await tx.episode.findUnique({ where: { id }, ...EPISODE_QUERY });
  if (current === null || current.deletedAt !== null) throwNotFound('Episode', id);
  return current;
}

async function nextEpisodeNumber(tx: PrismaTx, patientId: string): Promise<number> {
  const aggregate = await tx.episode.aggregate({ where: { patientId }, _max: { episodeNumber: true } });
  return (aggregate._max.episodeNumber ?? 0) + 1;
}

@Injectable()
export class EpisodesService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async listForPatient(patientId: string): Promise<EpisodeSummaryDto[]> {
    const episodes = await this.prisma.episode.findMany({ where: { patientId }, ...EPISODE_QUERY, orderBy: { episodeNumber: 'asc' } });
    return episodes.map(toSummaryDto);
  }

  async getById(id: string): Promise<EpisodeDetailDto> {
    const episode = await this.prisma.episode.findUnique({ where: { id }, ...EPISODE_QUERY });
    if (!episode) throwNotFound('Episode', id);
    return toDetailDto(episode);
  }

  async create(patientId: string, dto: CreateEpisodeDto, currentUser: UserResponseDto, request: Request): Promise<EpisodeDetailDto> {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throwNotFound('Patient', patientId);

    const firstOrRepeat = dto.firstOrRepeat ?? 'FIRST';
    if (firstOrRepeat === 'REPEAT') {
      if (!dto.previousEpisodeId) {
        throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, 'READINESS_CHECK_FAILED', 'A repeat SIRT episode must reference the previous episode it follows.', {
          findings: [{ code: 'REPEAT_EPISODE_MISSING_PREVIOUS_EPISODE', severity: 'BLOCK', field: 'previousEpisodeId' }],
        });
      }
      const previous = await this.prisma.episode.findUnique({ where: { id: dto.previousEpisodeId } });
      if (!previous || previous.deletedAt !== null) throwNotFound('Episode', dto.previousEpisodeId);
      if (previous.patientId !== patientId) {
        throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, 'PREVIOUS_EPISODE_PATIENT_MISMATCH', 'previousEpisodeId must reference an episode belonging to the same patient.', { previousEpisodeId: dto.previousEpisodeId, patientId });
      }
    }

    const created = await this.prisma.withinTransaction(async (tx) => {
      const episodeNumber = await nextEpisodeNumber(tx, patientId);
      const episode = await tx.episode.create({
        data: {
          patientId,
          episodeNumber,
          firstOrRepeat: firstOrRepeat as never,
          previousEpisodeId: dto.previousEpisodeId ?? null,
          referralDate: dto.referralDate ? new Date(dto.referralDate) : null,
          referralSource: dto.referralSource ?? null,
          referringClinicianOverride: dto.referringClinicianOverride ?? null,
          createdById: currentUser.id,
          updatedById: currentUser.id,
        },
      });
      await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'Episode', entityId: episode.id, userId: currentUser.id, roleAtTime: currentUser.role as Role, afterSnapshot: episode as unknown as Record<string, unknown>, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
      return episode;
    }, 'serializable');

    return this.getById(created.id);
  }

  async patch(id: string, dto: PatchEpisodeDto, currentUser: UserResponseDto, request: Request): Promise<EpisodeDetailDto> {
    const existing = await this.prisma.episode.findUnique({ where: { id } });
    if (!existing) throwNotFound('Episode', id);
    await this.prisma.withinTransaction(async (tx) => {
      const result = await tx.episode.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          ...(dto.referralDate !== undefined && { referralDate: new Date(dto.referralDate) }),
          ...(dto.referralSource !== undefined && { referralSource: dto.referralSource }),
          ...(dto.referringClinicianOverride !== undefined && { referringClinicianOverride: dto.referringClinicianOverride }),
          updatedById: currentUser.id,
          version: { increment: 1 },
        },
      });
      if (result.count === 0) {
        const current = await tx.episode.findUnique({ where: { id }, select: { version: true, deletedAt: true } });
        if (current !== null && current.deletedAt !== null) throwNotFound('Episode', id);
        if (current === null) throwNotFound('Episode', id);
        throwOptimisticLockConflict({ entityType: 'Episode', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
      }
      const fresh = await tx.episode.findUnique({ where: { id } });
      if (!fresh) throwNotFound('Episode', id);
      await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'Episode', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role as Role, beforeSnapshot: existing as unknown as Record<string, unknown>, afterSnapshot: fresh as unknown as Record<string, unknown>, changedFields: buildChangedFields(existing as unknown as Record<string, unknown>, fresh as unknown as Record<string, unknown>, dto as unknown as Record<string, unknown>), ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
    });
    return this.getById(id);
  }

  async transition(id: string, dto: EpisodeTransitionDto, currentUser: UserResponseDto, request: Request) {
    const existing = await this.prisma.episode.findUnique({ where: { id }, ...EPISODE_QUERY });
    if (!existing) throwNotFound('Episode', id);
    const fromStatus = existing.status as EpisodeStatusValue;
    const toStatus = dto.toStatus as EpisodeStatusValue;

    if (fromStatus !== toStatus) {
      // The updateMany below only guards concurrency (expected from-status +
      // version) — it does not know about the transition graph, so an
      // invalid edge must be rejected here before any write is attempted.
      if (!isValidEpisodeTransition(fromStatus, toStatus)) {
        throw new ApiException(HttpStatus.CONFLICT, 'INVALID_STATE_TRANSITION', `Cannot transition to '${toStatus}': current status is '${fromStatus}'`, { entityId: id });
      }
      const findings: ReadinessFinding[] = [
        ...evaluateEpisodeStructuralReadiness({ firstOrRepeat: existing.firstOrRepeat, previousEpisodeId: existing.previousEpisodeId }),
        ...(toStatus === 'COMPLETED' ? evaluateEpisodeCompletionReadiness({ status: fromStatus, diagnosisId: existing.diagnosis?.id ?? null }) : []),
        ...(toStatus === 'MDT_APPROVED' ? evaluateMdtApprovalReadiness({ mdtRecordCount: existing._count.mdtRecords }) : []),
      ];
      const { unresolved, overridden } = resolveReadinessFindings(findings, dto.overrideWarnings ?? []);
      if (unresolved.length > 0) {
        throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, 'READINESS_CHECK_FAILED', 'This transition cannot proceed until the following are resolved.', { findings: unresolved });
      }
      return this.prisma.withinTransaction(async (tx) => {
        const result = await tx.episode.updateMany({
          where: { id, status: fromStatus, version: dto.version, deletedAt: null },
          data: {
            status: toStatus as never,
            deferredFromStatus: toStatus === 'DEFERRED' ? (fromStatus as never) : null,
            statusChangedAt: new Date(),
            statusChangedById: currentUser.id,
            updatedById: currentUser.id,
            version: { increment: 1 },
          },
        });
        if (result.count === 0) {
          const current = await reReadOrThrow(tx, id);
          if (current.status === toStatus) return alreadyInState(toDetailDto(current));
          if (current.version !== dto.version) throwOptimisticLockConflict({ entityType: 'Episode', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
          if (!isValidEpisodeTransition(current.status as EpisodeStatusValue, toStatus)) {
            throw new ApiException(HttpStatus.CONFLICT, 'INVALID_STATE_TRANSITION', `Cannot transition to '${toStatus}': current status is '${current.status}'`, { entityId: id });
          }
          throwOptimisticLockConflict({ entityType: 'Episode', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
        }
        const fresh = await reReadOrThrow(tx, id);
        await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'Episode', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role as Role, beforeSnapshot: existing as unknown as Record<string, unknown>, afterSnapshot: fresh as unknown as Record<string, unknown>, changedFields: { status: { before: fromStatus, after: toStatus } }, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: { reason: dto.reason ?? null, overriddenWarnings: overridden } });
        return transitioned(toDetailDto(fresh));
      });
    }

    // fromStatus === toStatus: already at the requested status — idempotent no-op.
    return alreadyInState(toDetailDto(existing));
  }

  async resume(id: string, dto: ResumeEpisodeDto, currentUser: UserResponseDto, request: Request) {
    const existing = await this.prisma.episode.findUnique({ where: { id }, ...EPISODE_QUERY });
    if (!existing) throwNotFound('Episode', id);
    if (existing.status !== 'DEFERRED') {
      return alreadyInState(toDetailDto(existing));
    }
    const targetStatus = (existing.deferredFromStatus ?? 'REFERRED') as EpisodeStatusValue;
    return this.prisma.withinTransaction(async (tx) => {
      const result = await tx.episode.updateMany({
        where: { id, status: 'DEFERRED', version: dto.version, deletedAt: null },
        data: { status: targetStatus as never, deferredFromStatus: null, statusChangedAt: new Date(), statusChangedById: currentUser.id, updatedById: currentUser.id, version: { increment: 1 } },
      });
      if (result.count === 0) {
        const current = await reReadOrThrow(tx, id);
        if (current.status !== 'DEFERRED') return alreadyInState(toDetailDto(current));
        throwOptimisticLockConflict({ entityType: 'Episode', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
      }
      const fresh = await reReadOrThrow(tx, id);
      await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'Episode', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role as Role, beforeSnapshot: existing as unknown as Record<string, unknown>, afterSnapshot: fresh as unknown as Record<string, unknown>, changedFields: { status: { before: 'DEFERRED', after: targetStatus } }, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
      return transitioned(toDetailDto(fresh));
    });
  }

  async duplicate(id: string, dto: DuplicateEpisodeDto, currentUser: UserResponseDto, request: Request): Promise<EpisodeDetailDto> {
    const source = await this.prisma.episode.findUnique({ where: { id }, include: { diagnosis: true } });
    if (!source || source.deletedAt !== null) throwNotFound('Episode', id);

    const created = await this.prisma.withinTransaction(async (tx) => {
      const episodeNumber = await nextEpisodeNumber(tx, source.patientId);
      const episode = await tx.episode.create({
        data: {
          patientId: source.patientId,
          episodeNumber,
          firstOrRepeat: 'REPEAT',
          previousEpisodeId: source.id,
          createdById: currentUser.id,
          updatedById: currentUser.id,
        },
      });
      if (dto.copyDiagnosisBasics && source.diagnosis) {
        await tx.diagnosis.create({
          data: {
            episodeId: episode.id,
            tumourType: source.diagnosis.tumourType,
            aetiology: source.diagnosis.aetiology,
            createdById: currentUser.id,
            updatedById: currentUser.id,
          },
        });
      }
      await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'Episode', entityId: episode.id, userId: currentUser.id, roleAtTime: currentUser.role as Role, afterSnapshot: episode as unknown as Record<string, unknown>, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: { duplicatedFromEpisodeId: source.id, copiedDiagnosisBasics: Boolean(dto.copyDiagnosisBasics && source.diagnosis) } });
      return episode;
    }, 'serializable');

    return this.getById(created.id);
  }

  async timeline(id: string): Promise<EpisodeTimelineEventDto[]> {
    const episode = await this.prisma.episode.findUnique({
      where: { id },
      include: { mdtRecords: { include: { mdtSession: { select: { sessionDate: true } } } } },
    });
    if (!episode) throwNotFound('Episode', id);

    const events: Array<{ type: string; label: string; date: Date | null; entityId: string | null }> = [];
    if (episode.referralDate) events.push({ type: 'REFERRAL', label: 'Referred', date: episode.referralDate, entityId: episode.id });
    for (const record of episode.mdtRecords) {
      events.push({ type: 'MDT', label: 'MDT discussion', date: record.mdtSession.sessionDate, entityId: record.id });
    }
    if (episode.statusChangedAt) events.push({ type: 'STATUS', label: `Status: ${episode.status}`, date: episode.statusChangedAt, entityId: episode.id });

    events.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.getTime() - b.date.getTime();
    });
    return events.map((e) => plainToInstance(EpisodeTimelineEventDto, e, { excludeExtraneousValues: true }));
  }
}
