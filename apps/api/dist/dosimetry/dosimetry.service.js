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
exports.DosimetryService = void 0;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const dosimetry_plan_dto_1 = require("./dto/dosimetry-plan.dto");
const global_exception_filter_1 = require("../common/filters/global-exception.filter");
const conflict_helper_1 = require("../common/helpers/conflict.helper");
const changed_fields_helper_1 = require("../common/helpers/changed-fields.helper");
const decimal_helper_1 = require("../common/helpers/decimal.helper");
const action_response_type_1 = require("../common/types/action-response.type");
function toDto(record) {
    return (0, class_transformer_1.plainToInstance)(dosimetry_plan_dto_1.DosimetryPlanDto, (0, decimal_helper_1.serializeDecimals)(record), { excludeExtraneousValues: true });
}
let DosimetryService = class DosimetryService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async listForEpisode(episodeId) {
        const plans = await this.prisma.dosimetryPlan.findMany({ where: { episodeId }, orderBy: { planDate: 'asc' } });
        return plans.map(toDto);
    }
    async getById(id) {
        const plan = await this.prisma.dosimetryPlan.findUnique({ where: { id } });
        if (!plan)
            (0, conflict_helper_1.throwNotFound)('DosimetryPlan', id);
        return toDto(plan);
    }
    async create(episodeId, dto, currentUser, request) {
        const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
        if (!episode)
            (0, conflict_helper_1.throwNotFound)('Episode', episodeId);
        if (dto.mappingSessionId) {
            const session = await this.prisma.mappingSession.findUnique({ where: { id: dto.mappingSessionId } });
            if (!session || session.deletedAt !== null || session.episodeId !== episodeId) {
                throw new global_exception_filter_1.ApiException(common_1.HttpStatus.UNPROCESSABLE_ENTITY, 'MAPPING_SESSION_EPISODE_MISMATCH', 'mappingSessionId must reference a mapping session belonging to the same episode.', { mappingSessionId: dto.mappingSessionId, episodeId });
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
            await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'DosimetryPlan', entityId: plan.id, userId: currentUser.id, roleAtTime: currentUser.role, afterSnapshot: plan, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
            return plan;
        }, 'serializable');
        return toDto(created);
    }
    async patch(id, dto, currentUser, request) {
        const existing = await this.prisma.dosimetryPlan.findUnique({ where: { id } });
        if (!existing)
            (0, conflict_helper_1.throwNotFound)('DosimetryPlan', id);
        if (existing.approvedAt !== null)
            throw new global_exception_filter_1.ApiException(common_1.HttpStatus.CONFLICT, 'RECORD_LOCKED', 'This dosimetry plan is already approved and cannot be edited.', { entityId: id });
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
                    ...(dto.lockStatus !== undefined && { lockStatus: dto.lockStatus }),
                    updatedById: currentUser.id,
                    version: { increment: 1 },
                },
            });
            if (result.count === 0) {
                const current = await tx.dosimetryPlan.findUnique({ where: { id }, select: { version: true, deletedAt: true, approvedAt: true } });
                if (!current || current.deletedAt !== null)
                    (0, conflict_helper_1.throwNotFound)('DosimetryPlan', id);
                if (current.approvedAt !== null)
                    throw new global_exception_filter_1.ApiException(common_1.HttpStatus.CONFLICT, 'RECORD_LOCKED', 'This dosimetry plan was approved by another user.', { entityId: id });
                (0, conflict_helper_1.throwOptimisticLockConflict)({ entityType: 'DosimetryPlan', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
            }
            const fresh = await tx.dosimetryPlan.findUnique({ where: { id } });
            if (!fresh)
                (0, conflict_helper_1.throwNotFound)('DosimetryPlan', id);
            await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'DosimetryPlan', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role, beforeSnapshot: existing, afterSnapshot: fresh, changedFields: (0, changed_fields_helper_1.buildChangedFields)(existing, fresh, dto), ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
            return fresh;
        });
        return toDto(updated);
    }
    async approve(id, currentUser, request) {
        const existing = await this.prisma.dosimetryPlan.findUnique({ where: { id } });
        if (!existing)
            (0, conflict_helper_1.throwNotFound)('DosimetryPlan', id);
        return this.prisma.withinTransaction(async (tx) => {
            const result = await tx.dosimetryPlan.updateMany({
                where: { id, approvedAt: null, deletedAt: null },
                data: { approvedAt: new Date(), approvedById: currentUser.id, lockStatus: 'LOCKED', updatedById: currentUser.id, version: { increment: 1 } },
            });
            if (result.count === 0) {
                const current = await tx.dosimetryPlan.findUnique({ where: { id } });
                if (!current || current.deletedAt !== null)
                    (0, conflict_helper_1.throwNotFound)('DosimetryPlan', id);
                if (current.approvedAt !== null)
                    return (0, action_response_type_1.alreadyInState)(toDto(current));
                throw new global_exception_filter_1.ApiException(common_1.HttpStatus.CONFLICT, 'INVALID_STATE_TRANSITION', 'Cannot approve this dosimetry plan.', { entityId: id });
            }
            const fresh = await tx.dosimetryPlan.findUnique({ where: { id } });
            if (!fresh)
                (0, conflict_helper_1.throwNotFound)('DosimetryPlan', id);
            await this.auditService.logInTx(tx, { eventType: 'APPROVE', entityType: 'DosimetryPlan', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role, beforeSnapshot: existing, afterSnapshot: fresh, changedFields: { approvedAt: { before: null, after: fresh.approvedAt } }, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
            return (0, action_response_type_1.transitioned)(toDto(fresh));
        });
    }
    async remove(id, version, currentUser, request) {
        const existing = await this.prisma.dosimetryPlan.findUnique({ where: { id } });
        if (!existing)
            (0, conflict_helper_1.throwNotFound)('DosimetryPlan', id);
        await this.prisma.withinTransaction(async (tx) => {
            const result = await tx.dosimetryPlan.updateMany({ where: { id, version, deletedAt: null }, data: { deletedAt: new Date(), updatedById: currentUser.id, version: { increment: 1 } } });
            if (result.count === 0) {
                const current = await tx.dosimetryPlan.findUnique({ where: { id }, select: { version: true, deletedAt: true } });
                if (!current || current.deletedAt !== null)
                    (0, conflict_helper_1.throwNotFound)('DosimetryPlan', id);
                (0, conflict_helper_1.throwOptimisticLockConflict)({ entityType: 'DosimetryPlan', entityId: id, submittedVersion: version, currentVersion: current.version });
            }
            await this.auditService.logInTx(tx, { eventType: 'DELETE', entityType: 'DosimetryPlan', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role, beforeSnapshot: existing, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
        });
    }
};
exports.DosimetryService = DosimetryService;
exports.DosimetryService = DosimetryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], DosimetryService);
