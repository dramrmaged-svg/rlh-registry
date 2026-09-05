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
exports.ToxicityService = void 0;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const toxicity_event_dto_1 = require("./dto/toxicity-event.dto");
const global_exception_filter_1 = require("../common/filters/global-exception.filter");
const conflict_helper_1 = require("../common/helpers/conflict.helper");
const changed_fields_helper_1 = require("../common/helpers/changed-fields.helper");
function toDto(record) {
    return (0, class_transformer_1.plainToInstance)(toxicity_event_dto_1.ToxicityEventDto, record, { excludeExtraneousValues: true });
}
let ToxicityService = class ToxicityService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async listForEpisode(episodeId) {
        const events = await this.prisma.toxicityEvent.findMany({ where: { episodeId }, orderBy: { createdAt: 'asc' } });
        return events.map(toDto);
    }
    async getById(id) {
        const event = await this.prisma.toxicityEvent.findUnique({ where: { id } });
        if (!event)
            (0, conflict_helper_1.throwNotFound)('ToxicityEvent', id);
        return toDto(event);
    }
    async create(episodeId, dto, currentUser, request) {
        const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
        if (!episode)
            (0, conflict_helper_1.throwNotFound)('Episode', episodeId);
        if (dto.treatmentSessionId) {
            const session = await this.prisma.treatmentSession.findUnique({ where: { id: dto.treatmentSessionId } });
            if (!session || session.deletedAt !== null || session.episodeId !== episodeId) {
                throw new global_exception_filter_1.ApiException(common_1.HttpStatus.UNPROCESSABLE_ENTITY, 'TREATMENT_SESSION_EPISODE_MISMATCH', 'treatmentSessionId must reference a treatment session belonging to the same episode.', { treatmentSessionId: dto.treatmentSessionId, episodeId });
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
            await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'ToxicityEvent', entityId: event.id, userId: currentUser.id, roleAtTime: currentUser.role, afterSnapshot: event, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
            return event;
        }, 'serializable');
        return toDto(created);
    }
    async patch(id, dto, currentUser, request) {
        const existing = await this.prisma.toxicityEvent.findUnique({ where: { id } });
        if (!existing)
            (0, conflict_helper_1.throwNotFound)('ToxicityEvent', id);
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
                    ...(dto.lockStatus !== undefined && { lockStatus: dto.lockStatus }),
                    updatedById: currentUser.id,
                    version: { increment: 1 },
                },
            });
            if (result.count === 0) {
                const current = await tx.toxicityEvent.findUnique({ where: { id }, select: { version: true, deletedAt: true } });
                if (!current || current.deletedAt !== null)
                    (0, conflict_helper_1.throwNotFound)('ToxicityEvent', id);
                (0, conflict_helper_1.throwOptimisticLockConflict)({ entityType: 'ToxicityEvent', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
            }
            const fresh = await tx.toxicityEvent.findUnique({ where: { id } });
            if (!fresh)
                (0, conflict_helper_1.throwNotFound)('ToxicityEvent', id);
            await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'ToxicityEvent', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role, beforeSnapshot: existing, afterSnapshot: fresh, changedFields: (0, changed_fields_helper_1.buildChangedFields)(existing, fresh, dto), ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
            return fresh;
        });
        return toDto(updated);
    }
    async remove(id, version, currentUser, request) {
        const existing = await this.prisma.toxicityEvent.findUnique({ where: { id } });
        if (!existing)
            (0, conflict_helper_1.throwNotFound)('ToxicityEvent', id);
        await this.prisma.withinTransaction(async (tx) => {
            const result = await tx.toxicityEvent.updateMany({ where: { id, version, deletedAt: null }, data: { deletedAt: new Date(), updatedById: currentUser.id, version: { increment: 1 } } });
            if (result.count === 0) {
                const current = await tx.toxicityEvent.findUnique({ where: { id }, select: { version: true, deletedAt: true } });
                if (!current || current.deletedAt !== null)
                    (0, conflict_helper_1.throwNotFound)('ToxicityEvent', id);
                (0, conflict_helper_1.throwOptimisticLockConflict)({ entityType: 'ToxicityEvent', entityId: id, submittedVersion: version, currentVersion: current.version });
            }
            await this.auditService.logInTx(tx, { eventType: 'DELETE', entityType: 'ToxicityEvent', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role, beforeSnapshot: existing, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
        });
    }
};
exports.ToxicityService = ToxicityService;
exports.ToxicityService = ToxicityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], ToxicityService);
