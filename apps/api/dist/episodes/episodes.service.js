"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpisodesService = void 0;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const episode_summary_dto_1 = require("./dto/episode-summary.dto");
const episode_detail_dto_1 = require("./dto/episode-detail.dto");
const episode_timeline_dto_1 = require("./dto/episode-timeline.dto");
const global_exception_filter_1 = require("../common/filters/global-exception.filter");
const conflict_helper_1 = require("../common/helpers/conflict.helper");
const action_response_type_1 = require("../common/types/action-response.type");
const changed_fields_helper_1 = require("../common/helpers/changed-fields.helper");
const episode_readiness_rules_1 = require("../common/validation/episode-readiness-rules");
const episode_status_transitions_1 = require("./episode-status-transitions");
const EPISODE_QUERY = {
    include: {
        // deletedAt is selected (not filtered — a to-one include has no `where`)
        // so activeDiagnosis() below can exclude a soft-deleted Diagnosis; the
        // Prisma soft-delete middleware only rewrites top-level queries, not
        // nested includes.
        diagnosis: { select: { id: true, tumourType: true, aetiology: true, confirmedBclcStage: true, confirmedCpGrade: true, deletedAt: true } },
        // Each counted relation is itself a soft-deletable model, and _count
        // does not go through the soft-delete middleware either — filter
        // explicitly so a deleted child is never counted as present.
        _count: {
            select: {
                mdtRecords: { where: { deletedAt: null } },
                lesions: { where: { deletedAt: null } },
                mappingSessions: { where: { deletedAt: null } },
                dosimetryPlans: { where: { deletedAt: null } },
                treatmentSessions: { where: { deletedAt: null } },
                followUps: { where: { deletedAt: null } },
                toxicityEvents: { where: { deletedAt: null } },
            },
        },
    },
};
/** A soft-deleted Diagnosis must never satisfy a readiness check or be shown as "present" — see EPISODE_QUERY's comment. */
function activeDiagnosis(record) {
    return record.diagnosis && record.diagnosis.deletedAt === null ? record.diagnosis : null;
}
function toSummaryDto(record) {
    return (0, class_transformer_1.plainToInstance)(episode_summary_dto_1.EpisodeSummaryDto, { ...record, availableActions: (0, episode_status_transitions_1.computeEpisodeAvailableActions)(record.status) }, { excludeExtraneousValues: true });
}
function toDetailDto(record) {
    return (0, class_transformer_1.plainToInstance)(episode_detail_dto_1.EpisodeDetailDto, {
        ...record,
        diagnosis: activeDiagnosis(record),
        availableActions: (0, episode_status_transitions_1.computeEpisodeAvailableActions)(record.status),
        completeness: {
            hasDiagnosis: activeDiagnosis(record) !== null,
            mdtRecordCount: record._count.mdtRecords,
            lesionCount: record._count.lesions,
            mappingSessionCount: record._count.mappingSessions,
            dosimetryPlanCount: record._count.dosimetryPlans,
            treatmentSessionCount: record._count.treatmentSessions,
            followUpCount: record._count.followUps,
            toxicityEventCount: record._count.toxicityEvents,
        },
    }, { excludeExtraneousValues: true });
}
async function reReadOrThrow(tx, id) {
    const current = await tx.episode.findUnique({ where: { id }, ...EPISODE_QUERY });
    if (current === null || current.deletedAt !== null)
        (0, conflict_helper_1.throwNotFound)('Episode', id);
    return current;
}
async function nextEpisodeNumber(tx, patientId) {
    const aggregate = await tx.episode.aggregate({ where: { patientId }, _max: { episodeNumber: true } });
    return (aggregate._max.episodeNumber ?? 0) + 1;
}
let EpisodesService = class EpisodesService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async listForPatient(patientId) {
        const episodes = await this.prisma.episode.findMany({ where: { patientId }, ...EPISODE_QUERY, orderBy: { episodeNumber: 'asc' } });
        return episodes.map(toSummaryDto);
    }
    async getById(id) {
        const episode = await this.prisma.episode.findUnique({ where: { id }, ...EPISODE_QUERY });
        if (!episode)
            (0, conflict_helper_1.throwNotFound)('Episode', id);
        return toDetailDto(episode);
    }
    async create(patientId, dto, currentUser, request) {
        const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
        if (!patient)
            (0, conflict_helper_1.throwNotFound)('Patient', patientId);
        const firstOrRepeat = dto.firstOrRepeat ?? 'FIRST';
        if (firstOrRepeat === 'REPEAT') {
            if (!dto.previousEpisodeId) {
                throw new global_exception_filter_1.ApiException(common_1.HttpStatus.UNPROCESSABLE_ENTITY, 'READINESS_CHECK_FAILED', 'A repeat SIRT episode must reference the previous episode it follows.', {
                    findings: [{ code: 'REPEAT_EPISODE_MISSING_PREVIOUS_EPISODE', severity: 'BLOCK', field: 'previousEpisodeId' }],
                });
            }
            const previous = await this.prisma.episode.findUnique({ where: { id: dto.previousEpisodeId } });
            if (!previous || previous.deletedAt !== null)
                (0, conflict_helper_1.throwNotFound)('Episode', dto.previousEpisodeId);
            if (previous.patientId !== patientId) {
                throw new global_exception_filter_1.ApiException(common_1.HttpStatus.UNPROCESSABLE_ENTITY, 'PREVIOUS_EPISODE_PATIENT_MISMATCH', 'previousEpisodeId must reference an episode belonging to the same patient.', { previousEpisodeId: dto.previousEpisodeId, patientId });
            }
        }
        const created = await this.prisma.withinTransaction(async (tx) => {
            const episodeNumber = await nextEpisodeNumber(tx, patientId);
            const episode = await tx.episode.create({
                data: {
                    patientId,
                    episodeNumber,
                    firstOrRepeat: firstOrRepeat,
                    // A previousEpisodeId is only meaningful (and ownership-checked,
                    // above) for REPEAT episodes — silently discard it for FIRST so a
                    // client can't link a FIRST episode to another patient's episode,
                    // or trigger an uncaught FK violation with a bogus id.
                    previousEpisodeId: firstOrRepeat === 'REPEAT' ? dto.previousEpisodeId : null,
                    referralDate: dto.referralDate ? new Date(dto.referralDate) : null,
                    referralSource: dto.referralSource ?? null,
                    referringClinicianOverride: dto.referringClinicianOverride ?? null,
                    createdById: currentUser.id,
                    updatedById: currentUser.id,
                },
            });
            await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'Episode', entityId: episode.id, userId: currentUser.id, roleAtTime: currentUser.role, afterSnapshot: episode, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
            return episode;
        }, 'serializable');
        return this.getById(created.id);
    }
    async patch(id, dto, currentUser, request) {
        const existing = await this.prisma.episode.findUnique({ where: { id } });
        if (!existing)
            (0, conflict_helper_1.throwNotFound)('Episode', id);
        await this.prisma.withinTransaction(async (tx) => {
            const result = await tx.episode.updateMany({
                where: { id, version: dto.version, deletedAt: null },
                data: {
                    ...(dto.referralDate !== undefined && { referralDate: dto.referralDate === null ? null : new Date(dto.referralDate) }),
                    ...(dto.referralSource !== undefined && { referralSource: dto.referralSource }),
                    ...(dto.referringClinicianOverride !== undefined && { referringClinicianOverride: dto.referringClinicianOverride }),
                    updatedById: currentUser.id,
                    version: { increment: 1 },
                },
            });
            if (result.count === 0) {
                const current = await tx.episode.findUnique({ where: { id }, select: { version: true, deletedAt: true } });
                if (current !== null && current.deletedAt !== null)
                    (0, conflict_helper_1.throwNotFound)('Episode', id);
                if (current === null)
                    (0, conflict_helper_1.throwNotFound)('Episode', id);
                (0, conflict_helper_1.throwOptimisticLockConflict)({ entityType: 'Episode', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
            }
            const fresh = await tx.episode.findUnique({ where: { id } });
            if (!fresh)
                (0, conflict_helper_1.throwNotFound)('Episode', id);
            await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'Episode', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role, beforeSnapshot: existing, afterSnapshot: fresh, changedFields: (0, changed_fields_helper_1.buildChangedFields)(existing, fresh, dto), ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
        });
        return this.getById(id);
    }
    async transition(id, dto, currentUser, request) {
        const existing = await this.prisma.episode.findUnique({ where: { id }, ...EPISODE_QUERY });
        if (!existing)
            (0, conflict_helper_1.throwNotFound)('Episode', id);
        const fromStatus = existing.status;
        const toStatus = dto.toStatus;
        if (fromStatus !== toStatus) {
            // The updateMany below only guards concurrency (expected from-status +
            // version) — it does not know about the transition graph, so an
            // invalid edge must be rejected here before any write is attempted.
            if (!(0, episode_status_transitions_1.isValidEpisodeTransition)(fromStatus, toStatus)) {
                throw new global_exception_filter_1.ApiException(common_1.HttpStatus.CONFLICT, 'INVALID_STATE_TRANSITION', `Cannot transition to '${toStatus}': current status is '${fromStatus}'`, { entityId: id });
            }
            const findings = [
                ...(0, episode_readiness_rules_1.evaluateEpisodeStructuralReadiness)({ firstOrRepeat: existing.firstOrRepeat, previousEpisodeId: existing.previousEpisodeId }),
                ...(toStatus === 'COMPLETED' ? (0, episode_readiness_rules_1.evaluateEpisodeCompletionReadiness)({ status: fromStatus, diagnosisId: activeDiagnosis(existing)?.id ?? null }) : []),
                ...(toStatus === 'MDT_APPROVED' ? (0, episode_readiness_rules_1.evaluateMdtApprovalReadiness)({ mdtRecordCount: existing._count.mdtRecords }) : []),
            ];
            const { unresolved, overridden } = (0, episode_readiness_rules_1.resolveReadinessFindings)(findings, dto.overrideWarnings ?? []);
            if (unresolved.length > 0) {
                throw new global_exception_filter_1.ApiException(common_1.HttpStatus.UNPROCESSABLE_ENTITY, 'READINESS_CHECK_FAILED', 'This transition cannot proceed until the following are resolved.', { findings: unresolved });
            }
            return this.prisma.withinTransaction(async (tx) => {
                const result = await tx.episode.updateMany({
                    where: { id, status: fromStatus, version: dto.version, deletedAt: null },
                    data: {
                        status: toStatus,
                        deferredFromStatus: toStatus === 'DEFERRED' ? fromStatus : null,
                        statusChangedAt: new Date(),
                        statusChangedById: currentUser.id,
                        updatedById: currentUser.id,
                        version: { increment: 1 },
                    },
                });
                if (result.count === 0) {
                    const current = await reReadOrThrow(tx, id);
                    if (current.status === toStatus)
                        return (0, action_response_type_1.alreadyInState)(toDetailDto(current));
                    if (current.version !== dto.version)
                        (0, conflict_helper_1.throwOptimisticLockConflict)({ entityType: 'Episode', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
                    if (!(0, episode_status_transitions_1.isValidEpisodeTransition)(current.status, toStatus)) {
                        throw new global_exception_filter_1.ApiException(common_1.HttpStatus.CONFLICT, 'INVALID_STATE_TRANSITION', `Cannot transition to '${toStatus}': current status is '${current.status}'`, { entityId: id });
                    }
                    (0, conflict_helper_1.throwOptimisticLockConflict)({ entityType: 'Episode', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
                }
                const fresh = await reReadOrThrow(tx, id);
                await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'Episode', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role, beforeSnapshot: existing, afterSnapshot: fresh, changedFields: { status: { before: fromStatus, after: toStatus } }, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: { reason: dto.reason ?? null, overriddenWarnings: overridden } });
                return (0, action_response_type_1.transitioned)(toDetailDto(fresh));
            });
        }
        // fromStatus === toStatus: already at the requested status — idempotent no-op.
        return (0, action_response_type_1.alreadyInState)(toDetailDto(existing));
    }
    async resume(id, dto, currentUser, request) {
        const existing = await this.prisma.episode.findUnique({ where: { id }, ...EPISODE_QUERY });
        if (!existing)
            (0, conflict_helper_1.throwNotFound)('Episode', id);
        if (existing.status !== 'DEFERRED') {
            return (0, action_response_type_1.alreadyInState)(toDetailDto(existing));
        }
        const targetStatus = (existing.deferredFromStatus ?? 'REFERRED');
        return this.prisma.withinTransaction(async (tx) => {
            const result = await tx.episode.updateMany({
                where: { id, status: 'DEFERRED', version: dto.version, deletedAt: null },
                data: { status: targetStatus, deferredFromStatus: null, statusChangedAt: new Date(), statusChangedById: currentUser.id, updatedById: currentUser.id, version: { increment: 1 } },
            });
            if (result.count === 0) {
                const current = await reReadOrThrow(tx, id);
                if (current.status !== 'DEFERRED')
                    return (0, action_response_type_1.alreadyInState)(toDetailDto(current));
                (0, conflict_helper_1.throwOptimisticLockConflict)({ entityType: 'Episode', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
            }
            const fresh = await reReadOrThrow(tx, id);
            await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'Episode', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role, beforeSnapshot: existing, afterSnapshot: fresh, changedFields: { status: { before: 'DEFERRED', after: targetStatus } }, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
            return (0, action_response_type_1.transitioned)(toDetailDto(fresh));
        });
    }
    async duplicate(id, dto, currentUser, request) {
        const source = await this.prisma.episode.findUnique({ where: { id }, include: { diagnosis: true } });
        if (!source || source.deletedAt !== null)
            (0, conflict_helper_1.throwNotFound)('Episode', id);
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
            await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'Episode', entityId: episode.id, userId: currentUser.id, roleAtTime: currentUser.role, afterSnapshot: episode, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: { duplicatedFromEpisodeId: source.id, copiedDiagnosisBasics: Boolean(dto.copyDiagnosisBasics && source.diagnosis) } });
            return episode;
        }, 'serializable');
        return this.getById(created.id);
    }
    async timeline(id) {
        const episode = await this.prisma.episode.findUnique({
            where: { id },
            include: { mdtRecords: { include: { mdtSession: { select: { sessionDate: true } } } } },
        });
        if (!episode)
            (0, conflict_helper_1.throwNotFound)('Episode', id);
        const events = [];
        if (episode.referralDate)
            events.push({ type: 'REFERRAL', label: 'Referred', date: episode.referralDate, entityId: episode.id });
        for (const record of episode.mdtRecords) {
            events.push({ type: 'MDT', label: 'MDT discussion', date: record.mdtSession.sessionDate, entityId: record.id });
        }
        if (episode.statusChangedAt)
            events.push({ type: 'STATUS', label: `Status: ${episode.status}`, date: episode.statusChangedAt, entityId: episode.id });
        events.sort((a, b) => {
            if (!a.date && !b.date)
                return 0;
            if (!a.date)
                return 1;
            if (!b.date)
                return -1;
            return a.date.getTime() - b.date.getTime();
        });
        return events.map((e) => (0, class_transformer_1.plainToInstance)(episode_timeline_dto_1.EpisodeTimelineEventDto, e, { excludeExtraneousValues: true }));
    }
};
exports.EpisodesService = EpisodesService;
exports.EpisodesService = EpisodesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], EpisodesService);
