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
exports.FollowUpService = void 0;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const follow_up_dto_1 = require("./dto/follow-up.dto");
const global_exception_filter_1 = require("../common/filters/global-exception.filter");
const conflict_helper_1 = require("../common/helpers/conflict.helper");
const changed_fields_helper_1 = require("../common/helpers/changed-fields.helper");
function toDto(record) {
    return (0, class_transformer_1.plainToInstance)(follow_up_dto_1.FollowUpDto, record, { excludeExtraneousValues: true });
}
let FollowUpService = class FollowUpService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async listForEpisode(episodeId) {
        const followUps = await this.prisma.followUp.findMany({ where: { episodeId }, orderBy: { followUpDate: 'asc' } });
        return followUps.map(toDto);
    }
    async getById(id) {
        const followUp = await this.prisma.followUp.findUnique({ where: { id } });
        if (!followUp)
            (0, conflict_helper_1.throwNotFound)('FollowUp', id);
        return toDto(followUp);
    }
    async create(episodeId, dto, currentUser, request) {
        const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
        if (!episode)
            (0, conflict_helper_1.throwNotFound)('Episode', episodeId);
        if (dto.lesionId) {
            const lesion = await this.prisma.lesion.findUnique({ where: { id: dto.lesionId } });
            if (!lesion || lesion.deletedAt !== null || lesion.episodeId !== episodeId) {
                throw new global_exception_filter_1.ApiException(common_1.HttpStatus.UNPROCESSABLE_ENTITY, 'LESION_EPISODE_MISMATCH', 'lesionId must reference a lesion belonging to the same episode.', { lesionId: dto.lesionId, episodeId });
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
            await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'FollowUp', entityId: followUp.id, userId: currentUser.id, roleAtTime: currentUser.role, afterSnapshot: followUp, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
            return followUp;
        }, 'serializable');
        return toDto(created);
    }
    async patch(id, dto, currentUser, request) {
        const existing = await this.prisma.followUp.findUnique({ where: { id } });
        if (!existing)
            (0, conflict_helper_1.throwNotFound)('FollowUp', id);
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
                    ...(dto.lockStatus !== undefined && { lockStatus: dto.lockStatus }),
                    updatedById: currentUser.id,
                    version: { increment: 1 },
                },
            });
            if (result.count === 0) {
                const current = await tx.followUp.findUnique({ where: { id }, select: { version: true, deletedAt: true } });
                if (!current || current.deletedAt !== null)
                    (0, conflict_helper_1.throwNotFound)('FollowUp', id);
                (0, conflict_helper_1.throwOptimisticLockConflict)({ entityType: 'FollowUp', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
            }
            const fresh = await tx.followUp.findUnique({ where: { id } });
            if (!fresh)
                (0, conflict_helper_1.throwNotFound)('FollowUp', id);
            await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'FollowUp', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role, beforeSnapshot: existing, afterSnapshot: fresh, changedFields: (0, changed_fields_helper_1.buildChangedFields)(existing, fresh, dto), ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
            return fresh;
        });
        return toDto(updated);
    }
    async remove(id, version, currentUser, request) {
        const existing = await this.prisma.followUp.findUnique({ where: { id } });
        if (!existing)
            (0, conflict_helper_1.throwNotFound)('FollowUp', id);
        await this.prisma.withinTransaction(async (tx) => {
            const result = await tx.followUp.updateMany({ where: { id, version, deletedAt: null }, data: { deletedAt: new Date(), updatedById: currentUser.id, version: { increment: 1 } } });
            if (result.count === 0) {
                const current = await tx.followUp.findUnique({ where: { id }, select: { version: true, deletedAt: true } });
                if (!current || current.deletedAt !== null)
                    (0, conflict_helper_1.throwNotFound)('FollowUp', id);
                (0, conflict_helper_1.throwOptimisticLockConflict)({ entityType: 'FollowUp', entityId: id, submittedVersion: version, currentVersion: current.version });
            }
            await this.auditService.logInTx(tx, { eventType: 'DELETE', entityType: 'FollowUp', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role, beforeSnapshot: existing, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
        });
    }
};
exports.FollowUpService = FollowUpService;
exports.FollowUpService = FollowUpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], FollowUpService);
