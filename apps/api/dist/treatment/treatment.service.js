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
exports.TreatmentService = void 0;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const treatment_session_dto_1 = require("./dto/treatment-session.dto");
const dose_injection_dto_1 = require("./dto/dose-injection.dto");
const global_exception_filter_1 = require("../common/filters/global-exception.filter");
const conflict_helper_1 = require("../common/helpers/conflict.helper");
const changed_fields_helper_1 = require("../common/helpers/changed-fields.helper");
const decimal_helper_1 = require("../common/helpers/decimal.helper");
const episode_readiness_rules_1 = require("../common/validation/episode-readiness-rules");
function toSessionDto(record) {
    return (0, class_transformer_1.plainToInstance)(treatment_session_dto_1.TreatmentSessionDto, (0, decimal_helper_1.serializeDecimals)(record), { excludeExtraneousValues: true });
}
function toInjectionDto(record) {
    return (0, class_transformer_1.plainToInstance)(dose_injection_dto_1.DoseInjectionDto, (0, decimal_helper_1.serializeDecimals)(record), { excludeExtraneousValues: true });
}
async function nextSessionNumber(tx, episodeId) {
    const aggregate = await tx.treatmentSession.aggregate({ where: { episodeId }, _max: { sessionNumber: true } });
    return (aggregate._max.sessionNumber ?? 0) + 1;
}
let TreatmentService = class TreatmentService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async listForEpisode(episodeId) {
        const sessions = await this.prisma.treatmentSession.findMany({ where: { episodeId }, orderBy: { sessionNumber: 'asc' } });
        return sessions.map(toSessionDto);
    }
    async getById(id) {
        const session = await this.prisma.treatmentSession.findUnique({ where: { id } });
        if (!session)
            (0, conflict_helper_1.throwNotFound)('TreatmentSession', id);
        return toSessionDto(session);
    }
    async create(episodeId, dto, currentUser, request) {
        const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
        if (!episode)
            (0, conflict_helper_1.throwNotFound)('Episode', episodeId);
        if (dto.dosimetryPlanId) {
            const plan = await this.prisma.dosimetryPlan.findUnique({ where: { id: dto.dosimetryPlanId } });
            if (!plan || plan.deletedAt !== null || plan.episodeId !== episodeId) {
                throw new global_exception_filter_1.ApiException(common_1.HttpStatus.UNPROCESSABLE_ENTITY, 'DOSIMETRY_PLAN_EPISODE_MISMATCH', 'dosimetryPlanId must reference a dosimetry plan belonging to the same episode.', { dosimetryPlanId: dto.dosimetryPlanId, episodeId });
            }
        }
        const hasApprovedDosimetryPlan = (await this.prisma.dosimetryPlan.count({ where: { episodeId, approvedAt: { not: null }, deletedAt: null } })) > 0;
        const findings = (0, episode_readiness_rules_1.evaluateTreatmentSessionReadiness)({ hasApprovedDosimetryPlan });
        const { unresolved } = (0, episode_readiness_rules_1.resolveReadinessFindings)(findings, dto.overrideWarnings ?? []);
        if (unresolved.length > 0) {
            throw new global_exception_filter_1.ApiException(common_1.HttpStatus.UNPROCESSABLE_ENTITY, 'READINESS_CHECK_FAILED', 'This treatment session cannot be created until the following are resolved.', { findings: unresolved });
        }
        const created = await this.prisma.withinTransaction(async (tx) => {
            const sessionNumber = dto.sessionNumber ?? (await nextSessionNumber(tx, episodeId));
            const session = await tx.treatmentSession.create({
                data: {
                    episodeId,
                    dosimetryPlanId: dto.dosimetryPlanId ?? null,
                    sessionDate: new Date(dto.sessionDate),
                    sessionNumber,
                    status: dto.status ?? null,
                    accessRoute: dto.accessRoute ?? null,
                    accessSite: dto.accessSite ?? null,
                    catheterType: dto.catheterType ?? null,
                    fluoroTimeMin: dto.fluoroTimeMin ?? null,
                    dapGyCm2: dto.dapGyCm2 ?? null,
                    contrastVolumeMl: dto.contrastVolumeMl ?? null,
                    embolicMaterial: dto.embolicMaterial ?? null,
                    particleProduct: dto.particleProduct ?? null,
                    administeredActivityGbq: dto.administeredActivityGbq ?? null,
                    maaBalanceCheckedAtDelivery: dto.maaBalanceCheckedAtDelivery ?? null,
                    complications: dto.complications ?? null,
                    operatorUserId: dto.operatorUserId ?? null,
                    createdById: currentUser.id,
                    updatedById: currentUser.id,
                },
            });
            await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'TreatmentSession', entityId: session.id, userId: currentUser.id, roleAtTime: currentUser.role, afterSnapshot: session, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: { overriddenWarnings: dto.overrideWarnings ?? [] } });
            return session;
        }, 'serializable');
        return toSessionDto(created);
    }
    async patch(id, dto, currentUser, request) {
        const existing = await this.prisma.treatmentSession.findUnique({ where: { id } });
        if (!existing)
            (0, conflict_helper_1.throwNotFound)('TreatmentSession', id);
        const updated = await this.prisma.withinTransaction(async (tx) => {
            const result = await tx.treatmentSession.updateMany({
                where: { id, version: dto.version, deletedAt: null },
                data: {
                    ...(dto.dosimetryPlanId !== undefined && { dosimetryPlanId: dto.dosimetryPlanId }),
                    ...(dto.sessionDate !== undefined && { sessionDate: new Date(dto.sessionDate) }),
                    ...(dto.status !== undefined && { status: dto.status }),
                    ...(dto.accessRoute !== undefined && { accessRoute: dto.accessRoute }),
                    ...(dto.accessSite !== undefined && { accessSite: dto.accessSite }),
                    ...(dto.catheterType !== undefined && { catheterType: dto.catheterType }),
                    ...(dto.fluoroTimeMin !== undefined && { fluoroTimeMin: dto.fluoroTimeMin }),
                    ...(dto.dapGyCm2 !== undefined && { dapGyCm2: dto.dapGyCm2 }),
                    ...(dto.contrastVolumeMl !== undefined && { contrastVolumeMl: dto.contrastVolumeMl }),
                    ...(dto.embolicMaterial !== undefined && { embolicMaterial: dto.embolicMaterial }),
                    ...(dto.particleProduct !== undefined && { particleProduct: dto.particleProduct }),
                    ...(dto.administeredActivityGbq !== undefined && { administeredActivityGbq: dto.administeredActivityGbq }),
                    ...(dto.maaBalanceCheckedAtDelivery !== undefined && { maaBalanceCheckedAtDelivery: dto.maaBalanceCheckedAtDelivery }),
                    ...(dto.complications !== undefined && { complications: dto.complications }),
                    ...(dto.operatorUserId !== undefined && { operatorUserId: dto.operatorUserId }),
                    ...(dto.lockStatus !== undefined && { lockStatus: dto.lockStatus }),
                    updatedById: currentUser.id,
                    version: { increment: 1 },
                },
            });
            if (result.count === 0) {
                const current = await tx.treatmentSession.findUnique({ where: { id }, select: { version: true, deletedAt: true } });
                if (!current || current.deletedAt !== null)
                    (0, conflict_helper_1.throwNotFound)('TreatmentSession', id);
                (0, conflict_helper_1.throwOptimisticLockConflict)({ entityType: 'TreatmentSession', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
            }
            const fresh = await tx.treatmentSession.findUnique({ where: { id } });
            if (!fresh)
                (0, conflict_helper_1.throwNotFound)('TreatmentSession', id);
            await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'TreatmentSession', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role, beforeSnapshot: existing, afterSnapshot: fresh, changedFields: (0, changed_fields_helper_1.buildChangedFields)(existing, fresh, dto), ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
            return fresh;
        });
        return toSessionDto(updated);
    }
    async remove(id, version, currentUser, request) {
        const existing = await this.prisma.treatmentSession.findUnique({ where: { id } });
        if (!existing)
            (0, conflict_helper_1.throwNotFound)('TreatmentSession', id);
        await this.prisma.withinTransaction(async (tx) => {
            const result = await tx.treatmentSession.updateMany({ where: { id, version, deletedAt: null }, data: { deletedAt: new Date(), updatedById: currentUser.id, version: { increment: 1 } } });
            if (result.count === 0) {
                const current = await tx.treatmentSession.findUnique({ where: { id }, select: { version: true, deletedAt: true } });
                if (!current || current.deletedAt !== null)
                    (0, conflict_helper_1.throwNotFound)('TreatmentSession', id);
                (0, conflict_helper_1.throwOptimisticLockConflict)({ entityType: 'TreatmentSession', entityId: id, submittedVersion: version, currentVersion: current.version });
            }
            await this.auditService.logInTx(tx, { eventType: 'DELETE', entityType: 'TreatmentSession', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role, beforeSnapshot: existing, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
        });
    }
    async listDoseInjections(treatmentSessionId) {
        const injections = await this.prisma.lesionDoseInjection.findMany({ where: { treatmentSessionId }, orderBy: { createdAt: 'asc' } });
        return injections.map(toInjectionDto);
    }
    async createDoseInjection(treatmentSessionId, dto, currentUser, request) {
        const session = await this.prisma.treatmentSession.findUnique({ where: { id: treatmentSessionId } });
        if (!session)
            (0, conflict_helper_1.throwNotFound)('TreatmentSession', treatmentSessionId);
        const lesion = await this.prisma.lesion.findUnique({ where: { id: dto.lesionId } });
        if (!lesion || lesion.deletedAt !== null || lesion.episodeId !== session.episodeId) {
            throw new global_exception_filter_1.ApiException(common_1.HttpStatus.UNPROCESSABLE_ENTITY, 'LESION_EPISODE_MISMATCH', 'lesionId must reference a lesion belonging to the same episode as this treatment session.', { lesionId: dto.lesionId, episodeId: session.episodeId });
        }
        if (dto.lesionFeederId) {
            const feeder = await this.prisma.lesionFeeder.findUnique({ where: { id: dto.lesionFeederId } });
            if (!feeder || feeder.lesionId !== dto.lesionId) {
                throw new global_exception_filter_1.ApiException(common_1.HttpStatus.UNPROCESSABLE_ENTITY, 'LESION_FEEDER_LESION_MISMATCH', 'lesionFeederId must reference a feeder belonging to the referenced lesion.', { lesionFeederId: dto.lesionFeederId, lesionId: dto.lesionId });
            }
        }
        const created = await this.prisma.withinTransaction(async (tx) => {
            const injection = await tx.lesionDoseInjection.create({
                data: {
                    treatmentSessionId,
                    lesionId: dto.lesionId,
                    lesionFeederId: dto.lesionFeederId ?? null,
                    deliveredActivityGbq: dto.deliveredActivityGbq ?? null,
                    deliveredDoseGy: dto.deliveredDoseGy ?? null,
                    particleCount: dto.particleCount ?? null,
                    notes: dto.notes ?? null,
                },
            });
            await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'LesionDoseInjection', entityId: injection.id, userId: currentUser.id, roleAtTime: currentUser.role, afterSnapshot: injection, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
            return injection;
        });
        return toInjectionDto(created);
    }
};
exports.TreatmentService = TreatmentService;
exports.TreatmentService = TreatmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], TreatmentService);
