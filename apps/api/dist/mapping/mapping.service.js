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
exports.MappingService = void 0;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const mapping_session_dto_1 = require("./dto/mapping-session.dto");
const maa_study_dto_1 = require("./dto/maa-study.dto");
const conflict_helper_1 = require("../common/helpers/conflict.helper");
const changed_fields_helper_1 = require("../common/helpers/changed-fields.helper");
const decimal_helper_1 = require("../common/helpers/decimal.helper");
const calculations_1 = require("../calculations");
function toSessionDto(record) {
    return (0, class_transformer_1.plainToInstance)(mapping_session_dto_1.MappingSessionDto, (0, decimal_helper_1.serializeDecimals)(record), { excludeExtraneousValues: true });
}
function toMaaDto(record) {
    return (0, class_transformer_1.plainToInstance)(maa_study_dto_1.MaaStudyDto, (0, decimal_helper_1.serializeDecimals)(record), { excludeExtraneousValues: true });
}
let MappingService = class MappingService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async listForEpisode(episodeId) {
        const sessions = await this.prisma.mappingSession.findMany({ where: { episodeId }, orderBy: { sessionDate: 'asc' } });
        return sessions.map(toSessionDto);
    }
    async getById(id) {
        const session = await this.prisma.mappingSession.findUnique({ where: { id } });
        if (!session)
            (0, conflict_helper_1.throwNotFound)('MappingSession', id);
        return toSessionDto(session);
    }
    async create(episodeId, dto, currentUser, request) {
        const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
        if (!episode)
            (0, conflict_helper_1.throwNotFound)('Episode', episodeId);
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
            await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'MappingSession', entityId: session.id, userId: currentUser.id, roleAtTime: currentUser.role, afterSnapshot: session, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
            return session;
        }, 'serializable');
        return toSessionDto(created);
    }
    async patch(id, dto, currentUser, request) {
        const existing = await this.prisma.mappingSession.findUnique({ where: { id } });
        if (!existing)
            (0, conflict_helper_1.throwNotFound)('MappingSession', id);
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
                    ...(dto.lockStatus !== undefined && { lockStatus: dto.lockStatus }),
                    updatedById: currentUser.id,
                    version: { increment: 1 },
                },
            });
            if (result.count === 0) {
                const current = await tx.mappingSession.findUnique({ where: { id }, select: { version: true, deletedAt: true } });
                if (!current || current.deletedAt !== null)
                    (0, conflict_helper_1.throwNotFound)('MappingSession', id);
                (0, conflict_helper_1.throwOptimisticLockConflict)({ entityType: 'MappingSession', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
            }
            const fresh = await tx.mappingSession.findUnique({ where: { id } });
            if (!fresh)
                (0, conflict_helper_1.throwNotFound)('MappingSession', id);
            await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'MappingSession', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role, beforeSnapshot: existing, afterSnapshot: fresh, changedFields: (0, changed_fields_helper_1.buildChangedFields)(existing, fresh, dto), ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
            return fresh;
        });
        return toSessionDto(updated);
    }
    async remove(id, version, currentUser, request) {
        const existing = await this.prisma.mappingSession.findUnique({ where: { id } });
        if (!existing)
            (0, conflict_helper_1.throwNotFound)('MappingSession', id);
        await this.prisma.withinTransaction(async (tx) => {
            const result = await tx.mappingSession.updateMany({ where: { id, version, deletedAt: null }, data: { deletedAt: new Date(), updatedById: currentUser.id, version: { increment: 1 } } });
            if (result.count === 0) {
                const current = await tx.mappingSession.findUnique({ where: { id }, select: { version: true, deletedAt: true } });
                if (!current || current.deletedAt !== null)
                    (0, conflict_helper_1.throwNotFound)('MappingSession', id);
                (0, conflict_helper_1.throwOptimisticLockConflict)({ entityType: 'MappingSession', entityId: id, submittedVersion: version, currentVersion: current.version });
            }
            await this.auditService.logInTx(tx, { eventType: 'DELETE', entityType: 'MappingSession', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role, beforeSnapshot: existing, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
        });
    }
    async listMaaStudies(mappingSessionId) {
        const studies = await this.prisma.maaStudy.findMany({ where: { mappingSessionId }, orderBy: { studyDate: 'asc' } });
        return studies.map(toMaaDto);
    }
    /** LSF risk band is computed server-side from lungShuntFraction via the Phase 1 calculation engine — never client-supplied. */
    async createMaaStudy(mappingSessionId, dto, currentUser, request) {
        const session = await this.prisma.mappingSession.findUnique({ where: { id: mappingSessionId } });
        if (!session)
            (0, conflict_helper_1.throwNotFound)('MappingSession', mappingSessionId);
        const riskBand = (0, calculations_1.calculateLungShuntRiskBand)({ lungShuntFractionPercent: dto.lungShuntFraction });
        const created = await this.prisma.withinTransaction(async (tx) => {
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
                    calculationVersion: calculations_1.LUNG_SHUNT_FORMULA_VERSION,
                    createdById: currentUser.id,
                },
            });
            await (0, calculations_1.recordCalculationAudit)(tx, { entityType: 'MaaStudy', entityId: maaStudy.id, formulaId: 'LUNG_SHUNT_RISK_BAND', result: riskBand, inputsSnapshot: { lungShuntFractionPercent: dto.lungShuntFraction }, calculatedById: currentUser.id });
            await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'MaaStudy', entityId: maaStudy.id, userId: currentUser.id, roleAtTime: currentUser.role, afterSnapshot: maaStudy, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
            return maaStudy;
        });
        return toMaaDto(created);
    }
};
exports.MappingService = MappingService;
exports.MappingService = MappingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], MappingService);
