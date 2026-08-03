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
exports.MdtService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const mdt_record_dto_1 = require("./dto/mdt-record.dto");
const global_exception_filter_1 = require("../common/filters/global-exception.filter");
const conflict_helper_1 = require("../common/helpers/conflict.helper");
const action_response_type_1 = require("../common/types/action-response.type");
const changed_fields_helper_1 = require("../common/helpers/changed-fields.helper");
function computeMdtAvailableActions(lockStatus, role) {
    const isConsultantOrAdmin = role === 'ADMIN' || role === 'CONSULTANT_IR';
    const isAdmin = role === 'ADMIN';
    switch (lockStatus) {
        case 'DRAFT': return ['submit'];
        case 'SUBMITTED': return [...(isConsultantOrAdmin ? ['lock'] : []), ...(isAdmin ? ['unlock'] : [])];
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
};
function toMdtRecordDto(record, callerRole) {
    const snapshot = record.clinicalSnapshot ? { ...record.clinicalSnapshot, labPanelCollectedAt: record.clinicalSnapshot.labPanel?.collectedAt ?? null, clinicalScoreDate: record.clinicalSnapshot.clinicalScore?.scoreDate ?? null } : null;
    return (0, class_transformer_1.plainToInstance)(mdt_record_dto_1.MdtRecordDto, { ...record, clinicalSnapshot: snapshot, availableActions: computeMdtAvailableActions(record.lockStatus, callerRole) }, { excludeExtraneousValues: true });
}
async function reReadOrThrow(tx, id) {
    const current = await tx.mdtRecord.findUnique({ where: { id }, ...MDT_RECORD_QUERY });
    if (current === null || current.deletedAt !== null)
        (0, conflict_helper_1.throwNotFound)('MdtRecord', id);
    return current;
}
let MdtService = class MdtService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async listForEpisode(episodeId, callerRole) {
        const records = await this.prisma.mdtRecord.findMany({ where: { episodeId }, ...MDT_RECORD_QUERY, orderBy: { createdAt: 'desc' } });
        return records.map((r) => toMdtRecordDto(r, callerRole));
    }
    async getRecord(id, callerRole) {
        const record = await this.prisma.mdtRecord.findUnique({ where: { id }, ...MDT_RECORD_QUERY });
        if (!record)
            (0, conflict_helper_1.throwNotFound)('MdtRecord', id);
        return toMdtRecordDto(record, callerRole);
    }
    async create(episodeId, dto, currentUser, request) {
        const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
        if (!episode)
            (0, conflict_helper_1.throwNotFound)('Episode', episodeId);
        const session = await this.prisma.mdtSession.findUnique({ where: { id: dto.mdtSessionId } });
        if (!session)
            (0, conflict_helper_1.throwNotFound)('MdtSession', dto.mdtSessionId);
        try {
            const record = await this.prisma.withinTransaction(async (tx) => {
                const latestScore = await tx.clinicalScore.findFirst({ where: { episodeId }, orderBy: { scoreDate: 'desc' } });
                const latestLab = await tx.labPanel.findFirst({ where: { episodeId, submittedAt: { not: null } }, orderBy: { collectedAt: 'desc' } });
                let snapshotId = null;
                if (latestScore) {
                    const snapshot = await tx.clinicalSnapshot.create({ data: { episodeId, snapshotDate: new Date(), snapshotContext: 'MDT_REVIEW', clinicalScoreId: latestScore.id, labPanelId: latestLab?.id ?? null, ecogScore: latestScore.ecogScore, cpGrade: latestScore.cpGrade, cpTotalScore: latestScore.cpTotalScore, meld3Score: latestScore.meld3Score, meldNaScore: latestScore.meldNaScore, meldNaScoreRounded: latestScore.meldNaScoreRounded, albiGrade: latestScore.albiGrade, albiScore: latestScore.albiScore, bclcStage: latestScore.bclcStage, bsaM2: latestScore.bsaM2, weightKg: latestScore.weightKg, calculationVersion: latestScore.calculationVersion, createdById: currentUser.id } });
                    snapshotId = snapshot.id;
                }
                const created = await tx.mdtRecord.create({ data: { episodeId, mdtSessionId: dto.mdtSessionId, clinicalSnapshotId: snapshotId, diseaseSummary: dto.diseaseSummary ?? null, priorTreatmentSummary: dto.priorTreatmentSummary ?? null, decision: dto.decision ?? null, decisionDetail: dto.decisionDetail ?? null, decisionConditions: dto.decisionConditions ?? null, patientFitForProcedure: dto.patientFitForProcedure ?? null, performanceStatusAcceptable: dto.performanceStatusAcceptable ?? null, liverFunctionAcceptable: dto.liverFunctionAcceptable ?? null, tumourLoadAcceptable: dto.tumourLoadAcceptable ?? null, lockStatus: 'DRAFT', createdById: currentUser.id, updatedById: currentUser.id } });
                await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'MdtRecord', entityId: created.id, userId: currentUser.id, roleAtTime: currentUser.role, afterSnapshot: created, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
                return created;
            }, 'read-committed');
            const fresh = await this.prisma.mdtRecord.findUnique({ where: { id: record.id }, ...MDT_RECORD_QUERY });
            if (!fresh)
                (0, conflict_helper_1.throwNotFound)('MdtRecord', record.id);
            return toMdtRecordDto(fresh, currentUser.role);
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002')
                throw new global_exception_filter_1.ApiException(common_1.HttpStatus.CONFLICT, 'DUPLICATE_MDT_RECORD', 'An MDT record already exists for this episode and session.', { episodeId, mdtSessionId: dto.mdtSessionId });
            throw err;
        }
    }
    async patch(id, dto, currentUser, request) {
        const existing = await this.prisma.mdtRecord.findUnique({ where: { id }, ...MDT_RECORD_QUERY });
        if (!existing)
            (0, conflict_helper_1.throwNotFound)('MdtRecord', id);
        if (existing.lockStatus === 'LOCKED')
            throw new common_1.ForbiddenException({ code: 'RECORD_LOCKED', message: 'This MDT record is finalized.' });
        if (existing.lockStatus === 'SUBMITTED' && currentUser.role !== 'ADMIN' && currentUser.role !== 'CONSULTANT_IR')
            throw new common_1.ForbiddenException({ code: 'FORBIDDEN', message: 'Only Consultants can edit a submitted MDT record.' });
        const updated = await this.prisma.withinTransaction(async (tx) => {
            const result = await tx.mdtRecord.updateMany({ where: { id, version: dto.version, lockStatus: { not: 'LOCKED' }, deletedAt: null }, data: { ...(dto.diseaseSummary !== undefined && { diseaseSummary: dto.diseaseSummary }), ...(dto.priorTreatmentSummary !== undefined && { priorTreatmentSummary: dto.priorTreatmentSummary }), ...(dto.decision !== undefined && { decision: dto.decision }), ...(dto.decisionDetail !== undefined && { decisionDetail: dto.decisionDetail }), ...(dto.decisionConditions !== undefined && { decisionConditions: dto.decisionConditions }), ...(dto.patientFitForProcedure !== undefined && { patientFitForProcedure: dto.patientFitForProcedure }), ...(dto.performanceStatusAcceptable !== undefined && { performanceStatusAcceptable: dto.performanceStatusAcceptable }), ...(dto.liverFunctionAcceptable !== undefined && { liverFunctionAcceptable: dto.liverFunctionAcceptable }), ...(dto.tumourLoadAcceptable !== undefined && { tumourLoadAcceptable: dto.tumourLoadAcceptable }), updatedById: currentUser.id, version: { increment: 1 } } });
            if (result.count === 0) {
                const current = await tx.mdtRecord.findUnique({ where: { id }, select: { version: true, lockStatus: true, deletedAt: true } });
                if (current !== null && current.deletedAt !== null)
                    (0, conflict_helper_1.throwNotFound)('MdtRecord', id);
                if (current === null)
                    (0, conflict_helper_1.throwNotFound)('MdtRecord', id);
                if (current.lockStatus === 'LOCKED')
                    throw new common_1.ForbiddenException({ code: 'RECORD_LOCKED', message: 'This record was locked by a concurrent request.' });
                (0, conflict_helper_1.throwOptimisticLockConflict)({ entityType: 'MdtRecord', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
            }
            const fresh = await tx.mdtRecord.findUnique({ where: { id }, ...MDT_RECORD_QUERY });
            if (!fresh)
                (0, conflict_helper_1.throwNotFound)('MdtRecord', id);
            await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'MdtRecord', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role, beforeSnapshot: existing, afterSnapshot: fresh, changedFields: (0, changed_fields_helper_1.buildChangedFields)(existing, fresh, dto), ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
            return fresh;
        });
        return toMdtRecordDto(updated, currentUser.role);
    }
    async submit(id, currentUser, request) {
        const existing = await this.prisma.mdtRecord.findUnique({ where: { id }, ...MDT_RECORD_QUERY });
        if (!existing)
            (0, conflict_helper_1.throwNotFound)('MdtRecord', id);
        return this.prisma.withinTransaction(async (tx) => {
            const result = await tx.mdtRecord.updateMany({ where: { id, lockStatus: 'DRAFT', deletedAt: null }, data: { lockStatus: 'SUBMITTED', submittedAt: new Date(), submittedById: currentUser.id, updatedById: currentUser.id } });
            if (result.count === 0) {
                const current = await reReadOrThrow(tx, id);
                if (current.lockStatus === 'SUBMITTED')
                    return (0, action_response_type_1.alreadyInState)(toMdtRecordDto(current, currentUser.role));
                throw new global_exception_filter_1.ApiException(common_1.HttpStatus.CONFLICT, 'INVALID_STATE_TRANSITION', `Cannot submit: current status is '${current.lockStatus}'`, { entityId: id });
            }
            const fresh = await tx.mdtRecord.findUnique({ where: { id }, ...MDT_RECORD_QUERY });
            if (!fresh)
                (0, conflict_helper_1.throwNotFound)('MdtRecord', id);
            await this.auditService.logInTx(tx, { eventType: 'SUBMIT', entityType: 'MdtRecord', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role, beforeSnapshot: existing, afterSnapshot: fresh, changedFields: { lockStatus: { before: existing.lockStatus, after: 'SUBMITTED' } }, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
            return (0, action_response_type_1.transitioned)(toMdtRecordDto(fresh, currentUser.role));
        });
    }
    async lock(id, currentUser, request) {
        const existing = await this.prisma.mdtRecord.findUnique({ where: { id }, ...MDT_RECORD_QUERY });
        if (!existing)
            (0, conflict_helper_1.throwNotFound)('MdtRecord', id);
        return this.prisma.withinTransaction(async (tx) => {
            const result = await tx.mdtRecord.updateMany({ where: { id, lockStatus: 'SUBMITTED', deletedAt: null }, data: { lockStatus: 'LOCKED', lockedAt: new Date(), lockedById: currentUser.id, updatedById: currentUser.id } });
            if (result.count === 0) {
                const current = await reReadOrThrow(tx, id);
                if (current.lockStatus === 'LOCKED')
                    return (0, action_response_type_1.alreadyInState)(toMdtRecordDto(current, currentUser.role));
                throw new global_exception_filter_1.ApiException(common_1.HttpStatus.CONFLICT, 'INVALID_STATE_TRANSITION', `Cannot lock: current status is '${current.lockStatus}'`, { entityId: id });
            }
            const fresh = await tx.mdtRecord.findUnique({ where: { id }, ...MDT_RECORD_QUERY });
            if (!fresh)
                (0, conflict_helper_1.throwNotFound)('MdtRecord', id);
            await this.auditService.logInTx(tx, { eventType: 'LOCK', entityType: 'MdtRecord', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role, beforeSnapshot: existing, afterSnapshot: fresh, changedFields: { lockStatus: { before: existing.lockStatus, after: 'LOCKED' } }, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
            return (0, action_response_type_1.transitioned)(toMdtRecordDto(fresh, currentUser.role));
        });
    }
    async unlock(id, reason, currentUser, request) {
        if (!reason || reason.trim().length < 10)
            throw new common_1.BadRequestException({ code: 'VALIDATION_ERROR', message: 'Unlock reason must be at least 10 characters.' });
        const existing = await this.prisma.mdtRecord.findUnique({ where: { id }, ...MDT_RECORD_QUERY });
        if (!existing)
            (0, conflict_helper_1.throwNotFound)('MdtRecord', id);
        return this.prisma.withinTransaction(async (tx) => {
            const result = await tx.mdtRecord.updateMany({ where: { id, lockStatus: 'LOCKED', deletedAt: null }, data: { lockStatus: 'SUBMITTED', lockedAt: null, lockedById: null, updatedById: currentUser.id } });
            if (result.count === 0) {
                const current = await reReadOrThrow(tx, id);
                if (current.lockStatus === 'SUBMITTED' || current.lockStatus === 'DRAFT')
                    return (0, action_response_type_1.alreadyInState)(toMdtRecordDto(current, currentUser.role));
                throw new global_exception_filter_1.ApiException(common_1.HttpStatus.CONFLICT, 'INVALID_STATE_TRANSITION', `Cannot unlock: current status is '${current.lockStatus}'`, { entityId: id });
            }
            const fresh = await tx.mdtRecord.findUnique({ where: { id }, ...MDT_RECORD_QUERY });
            if (!fresh)
                (0, conflict_helper_1.throwNotFound)('MdtRecord', id);
            await this.auditService.logInTx(tx, { eventType: 'UNLOCK', entityType: 'MdtRecord', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role, beforeSnapshot: existing, afterSnapshot: fresh, changedFields: { lockStatus: { before: 'LOCKED', after: 'SUBMITTED' } }, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: { overrideReason: reason } });
            return (0, action_response_type_1.transitioned)(toMdtRecordDto(fresh, currentUser.role));
        });
    }
};
exports.MdtService = MdtService;
exports.MdtService = MdtService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], MdtService);
