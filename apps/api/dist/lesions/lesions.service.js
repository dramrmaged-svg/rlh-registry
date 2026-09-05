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
exports.LesionsService = void 0;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const lesion_dto_1 = require("./dto/lesion.dto");
const conflict_helper_1 = require("../common/helpers/conflict.helper");
const changed_fields_helper_1 = require("../common/helpers/changed-fields.helper");
const decimal_helper_1 = require("../common/helpers/decimal.helper");
function toDto(record) {
    return (0, class_transformer_1.plainToInstance)(lesion_dto_1.LesionDto, (0, decimal_helper_1.serializeDecimals)(record), { excludeExtraneousValues: true });
}
async function nextLesionNumber(tx, episodeId) {
    const aggregate = await tx.lesion.aggregate({ where: { episodeId }, _max: { lesionNumber: true } });
    return (aggregate._max.lesionNumber ?? 0) + 1;
}
let LesionsService = class LesionsService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async listForEpisode(episodeId) {
        const lesions = await this.prisma.lesion.findMany({ where: { episodeId }, orderBy: { lesionNumber: 'asc' } });
        return lesions.map(toDto);
    }
    async getById(id) {
        const lesion = await this.prisma.lesion.findUnique({ where: { id } });
        if (!lesion)
            (0, conflict_helper_1.throwNotFound)('Lesion', id);
        return toDto(lesion);
    }
    async create(episodeId, dto, currentUser, request) {
        const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
        if (!episode)
            (0, conflict_helper_1.throwNotFound)('Episode', episodeId);
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
            await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'Lesion', entityId: lesion.id, userId: currentUser.id, roleAtTime: currentUser.role, afterSnapshot: lesion, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
            return lesion;
        }, 'serializable');
        return toDto(created);
    }
    async patch(id, dto, currentUser, request) {
        const existing = await this.prisma.lesion.findUnique({ where: { id } });
        if (!existing)
            (0, conflict_helper_1.throwNotFound)('Lesion', id);
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
                if (!current || current.deletedAt !== null)
                    (0, conflict_helper_1.throwNotFound)('Lesion', id);
                (0, conflict_helper_1.throwOptimisticLockConflict)({ entityType: 'Lesion', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
            }
            const fresh = await tx.lesion.findUnique({ where: { id } });
            if (!fresh)
                (0, conflict_helper_1.throwNotFound)('Lesion', id);
            await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'Lesion', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role, beforeSnapshot: existing, afterSnapshot: fresh, changedFields: (0, changed_fields_helper_1.buildChangedFields)(existing, fresh, dto), ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
            return fresh;
        });
        return toDto(updated);
    }
    async remove(id, version, currentUser, request) {
        const existing = await this.prisma.lesion.findUnique({ where: { id } });
        if (!existing)
            (0, conflict_helper_1.throwNotFound)('Lesion', id);
        await this.prisma.withinTransaction(async (tx) => {
            const result = await tx.lesion.updateMany({ where: { id, version, deletedAt: null }, data: { deletedAt: new Date(), updatedById: currentUser.id, version: { increment: 1 } } });
            if (result.count === 0) {
                const current = await tx.lesion.findUnique({ where: { id }, select: { version: true, deletedAt: true } });
                if (!current || current.deletedAt !== null)
                    (0, conflict_helper_1.throwNotFound)('Lesion', id);
                (0, conflict_helper_1.throwOptimisticLockConflict)({ entityType: 'Lesion', entityId: id, submittedVersion: version, currentVersion: current.version });
            }
            await this.auditService.logInTx(tx, { eventType: 'DELETE', entityType: 'Lesion', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role, beforeSnapshot: existing, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
        });
    }
};
exports.LesionsService = LesionsService;
exports.LesionsService = LesionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], LesionsService);
