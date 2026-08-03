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
exports.DiagnosisService = void 0;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const diagnosis_dto_1 = require("./dto/diagnosis.dto");
const global_exception_filter_1 = require("../common/filters/global-exception.filter");
const conflict_helper_1 = require("../common/helpers/conflict.helper");
const changed_fields_helper_1 = require("../common/helpers/changed-fields.helper");
const decimal_helper_1 = require("../common/helpers/decimal.helper");
const calculations_1 = require("../calculations");
const CALC_ENGINE_VERSION = 'phase1-calc-engine-1.0.0';
function toDto(record) {
    return (0, class_transformer_1.plainToInstance)(diagnosis_dto_1.DiagnosisDto, (0, decimal_helper_1.serializeDecimals)(record), { excludeExtraneousValues: true });
}
const BCLC_TO_PRISMA_ENUM = {
    '0': 'STAGE_0', A: 'STAGE_A', B: 'STAGE_B', C: 'STAGE_C', D: 'STAGE_D',
};
let DiagnosisService = class DiagnosisService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async getForEpisode(episodeId) {
        const diagnosis = await this.prisma.diagnosis.findUnique({ where: { episodeId } });
        if (!diagnosis)
            (0, conflict_helper_1.throwNotFound)('Diagnosis', episodeId);
        return toDto(diagnosis);
    }
    async create(episodeId, dto, currentUser, request) {
        const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
        if (!episode)
            (0, conflict_helper_1.throwNotFound)('Episode', episodeId);
        const existing = await this.prisma.diagnosis.findUnique({ where: { episodeId } });
        if (existing)
            throw new global_exception_filter_1.ApiException(common_1.HttpStatus.CONFLICT, 'DUPLICATE_DIAGNOSIS', 'This episode already has a diagnosis record; use PATCH to update it.', { episodeId });
        const created = await this.prisma.withinTransaction(async (tx) => {
            const diagnosis = await tx.diagnosis.create({
                data: {
                    episodeId,
                    tumourType: dto.tumourType,
                    aetiology: dto.aetiology ?? null,
                    diagnosisDate: dto.diagnosisDate ? new Date(dto.diagnosisDate) : null,
                    histologyConfirmed: dto.histologyConfirmed ?? null,
                    confirmedBclcStage: dto.confirmedBclcStage ?? null,
                    bclcOverrideReason: dto.bclcOverrideReason ?? null,
                    confirmedTStage: dto.confirmedTStage ?? null,
                    confirmedNStage: dto.confirmedNStage ?? null,
                    confirmedMStage: dto.confirmedMStage ?? null,
                    tnmOverrideReason: dto.tnmOverrideReason ?? null,
                    confirmedCpGrade: dto.confirmedCpGrade ?? null,
                    cpOverrideReason: dto.cpOverrideReason ?? null,
                    meldOverrideReason: dto.meldOverrideReason ?? null,
                    albiOverrideReason: dto.albiOverrideReason ?? null,
                    createdById: currentUser.id,
                    updatedById: currentUser.id,
                },
            });
            await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'Diagnosis', entityId: diagnosis.id, userId: currentUser.id, roleAtTime: currentUser.role, afterSnapshot: diagnosis, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
            return diagnosis;
        }, 'serializable');
        return toDto(created);
    }
    async patch(episodeId, dto, currentUser, request) {
        const existing = await this.prisma.diagnosis.findUnique({ where: { episodeId } });
        if (!existing)
            (0, conflict_helper_1.throwNotFound)('Diagnosis', episodeId);
        const updated = await this.prisma.withinTransaction(async (tx) => {
            const result = await tx.diagnosis.updateMany({
                where: { episodeId, version: dto.version, deletedAt: null },
                data: {
                    ...(dto.tumourType !== undefined && { tumourType: dto.tumourType }),
                    ...(dto.aetiology !== undefined && { aetiology: dto.aetiology }),
                    ...(dto.diagnosisDate !== undefined && { diagnosisDate: dto.diagnosisDate === null ? null : new Date(dto.diagnosisDate) }),
                    ...(dto.histologyConfirmed !== undefined && { histologyConfirmed: dto.histologyConfirmed }),
                    ...(dto.confirmedBclcStage !== undefined && { confirmedBclcStage: dto.confirmedBclcStage }),
                    ...(dto.bclcOverrideReason !== undefined && { bclcOverrideReason: dto.bclcOverrideReason }),
                    ...(dto.confirmedTStage !== undefined && { confirmedTStage: dto.confirmedTStage }),
                    ...(dto.confirmedNStage !== undefined && { confirmedNStage: dto.confirmedNStage }),
                    ...(dto.confirmedMStage !== undefined && { confirmedMStage: dto.confirmedMStage }),
                    ...(dto.tnmOverrideReason !== undefined && { tnmOverrideReason: dto.tnmOverrideReason }),
                    ...(dto.confirmedCpGrade !== undefined && { confirmedCpGrade: dto.confirmedCpGrade }),
                    ...(dto.cpOverrideReason !== undefined && { cpOverrideReason: dto.cpOverrideReason }),
                    ...(dto.meldOverrideReason !== undefined && { meldOverrideReason: dto.meldOverrideReason }),
                    ...(dto.albiOverrideReason !== undefined && { albiOverrideReason: dto.albiOverrideReason }),
                    updatedById: currentUser.id,
                    version: { increment: 1 },
                },
            });
            if (result.count === 0) {
                const current = await tx.diagnosis.findUnique({ where: { episodeId }, select: { version: true, deletedAt: true } });
                if (!current || current.deletedAt !== null)
                    (0, conflict_helper_1.throwNotFound)('Diagnosis', episodeId);
                (0, conflict_helper_1.throwOptimisticLockConflict)({ entityType: 'Diagnosis', entityId: existing.id, submittedVersion: dto.version, currentVersion: current.version });
            }
            const fresh = await tx.diagnosis.findUnique({ where: { episodeId } });
            if (!fresh)
                (0, conflict_helper_1.throwNotFound)('Diagnosis', episodeId);
            await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'Diagnosis', entityId: existing.id, userId: currentUser.id, roleAtTime: currentUser.role, beforeSnapshot: existing, afterSnapshot: fresh, changedFields: (0, changed_fields_helper_1.buildChangedFields)(existing, fresh, dto), ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
            return fresh;
        });
        return toDto(updated);
    }
    /**
     * Runs the Phase 1 calculation engine against transient clinical inputs
     * (not persisted raw — see RecalculateDiagnosisDto) and writes the
     * calculatedX columns + a CalculationAudit row per formula. A formula that
     * comes back NOT_CALCULABLE this call leaves the existing calculatedX
     * value untouched rather than nulling out a previously good result —
     * missing inputs on one recalculation should not silently regress a prior
     * calculation.
     */
    async recalculate(episodeId, dto, currentUser, request) {
        const existing = await this.prisma.diagnosis.findUnique({ where: { episodeId } });
        if (!existing)
            (0, conflict_helper_1.throwNotFound)('Diagnosis', episodeId);
        const episode = await this.prisma.episode.findUnique({ where: { id: episodeId }, include: { patient: { select: { sex: true } } } });
        if (!episode)
            (0, conflict_helper_1.throwNotFound)('Episode', episodeId);
        const sex = dto.sex ?? episode.patient.sex;
        const childPugh = (0, calculations_1.calculateChildPugh)({ bilirubinUmolL: dto.bilirubinUmolL, albuminGL: dto.albuminGL, inr: dto.inr, ascites: dto.ascites, encephalopathy: dto.encephalopathy });
        const meld3 = (0, calculations_1.calculateMeld3)({ bilirubinUmolL: dto.bilirubinUmolL, sodiumMmolL: dto.sodiumMmolL, inr: dto.inr, creatinineUmolL: dto.creatinineUmolL, albuminGL: dto.albuminGL, sex, onDialysis: dto.onDialysis });
        const meldNa = (0, calculations_1.calculateMeldNa)({ bilirubinUmolL: dto.bilirubinUmolL, sodiumMmolL: dto.sodiumMmolL, inr: dto.inr, creatinineUmolL: dto.creatinineUmolL, albuminGL: dto.albuminGL, sex, onDialysis: dto.onDialysis });
        const albi = (0, calculations_1.calculateAlbi)({ bilirubinUmolL: dto.bilirubinUmolL, albuminGL: dto.albuminGL });
        const bclc = (0, calculations_1.calculateBclcStage)({ tumourCount: dto.tumourCount, largestDiameterCm: dto.largestDiameterCm, childPughGrade: childPugh.status === 'CALCULATED' ? childPugh.value?.grade : undefined, ecogScore: dto.ecogScore, pvtt: dto.pvtt, extrahepaticSpread: dto.extrahepaticSpread });
        const updated = await this.prisma.withinTransaction(async (tx) => {
            const diagnosis = await tx.diagnosis.update({
                where: { episodeId },
                data: {
                    ...(childPugh.status === 'CALCULATED' && { calculatedCpScore: childPugh.value.score, calculatedCpGrade: childPugh.value.grade }),
                    ...(meld3.status === 'CALCULATED' && { calculatedMeld3Score: meld3.value }),
                    ...(meldNa.status === 'CALCULATED' && { calculatedMeldNaScore: meldNa.value }),
                    ...(albi.status === 'CALCULATED' && { calculatedAlbiScore: albi.value.score, calculatedAlbiGrade: albi.value.grade }),
                    ...(bclc.status === 'CALCULATED' && { calculatedBclcStage: BCLC_TO_PRISMA_ENUM[bclc.value] }),
                    calculationVersion: CALC_ENGINE_VERSION,
                    updatedById: currentUser.id,
                    version: { increment: 1 },
                },
            });
            await (0, calculations_1.recordCalculationAudit)(tx, { entityType: 'Diagnosis', entityId: diagnosis.id, formulaId: 'CHILD_PUGH', result: childPugh, inputsSnapshot: { bilirubinUmolL: dto.bilirubinUmolL, albuminGL: dto.albuminGL, inr: dto.inr, ascites: dto.ascites, encephalopathy: dto.encephalopathy }, calculatedById: currentUser.id });
            await (0, calculations_1.recordCalculationAudit)(tx, { entityType: 'Diagnosis', entityId: diagnosis.id, formulaId: 'MELD_3_0', result: meld3, inputsSnapshot: { bilirubinUmolL: dto.bilirubinUmolL, sodiumMmolL: dto.sodiumMmolL, inr: dto.inr, creatinineUmolL: dto.creatinineUmolL, albuminGL: dto.albuminGL, sex, onDialysis: dto.onDialysis }, calculatedById: currentUser.id });
            await (0, calculations_1.recordCalculationAudit)(tx, { entityType: 'Diagnosis', entityId: diagnosis.id, formulaId: 'MELD_NA', result: meldNa, inputsSnapshot: { bilirubinUmolL: dto.bilirubinUmolL, sodiumMmolL: dto.sodiumMmolL, inr: dto.inr, creatinineUmolL: dto.creatinineUmolL, albuminGL: dto.albuminGL, sex, onDialysis: dto.onDialysis }, calculatedById: currentUser.id });
            await (0, calculations_1.recordCalculationAudit)(tx, { entityType: 'Diagnosis', entityId: diagnosis.id, formulaId: 'ALBI', result: albi, inputsSnapshot: { bilirubinUmolL: dto.bilirubinUmolL, albuminGL: dto.albuminGL }, calculatedById: currentUser.id });
            await (0, calculations_1.recordCalculationAudit)(tx, { entityType: 'Diagnosis', entityId: diagnosis.id, formulaId: 'BCLC_2022', result: bclc, inputsSnapshot: { tumourCount: dto.tumourCount, largestDiameterCm: dto.largestDiameterCm, childPughGrade: childPugh.status === 'CALCULATED' ? childPugh.value?.grade : undefined, ecogScore: dto.ecogScore, pvtt: dto.pvtt, extrahepaticSpread: dto.extrahepaticSpread }, calculatedById: currentUser.id });
            await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'Diagnosis', entityId: diagnosis.id, userId: currentUser.id, roleAtTime: currentUser.role, beforeSnapshot: existing, afterSnapshot: diagnosis, changedFields: null, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: { action: 'recalculate' } });
            return diagnosis;
        });
        const calculations = [
            (0, class_transformer_1.plainToInstance)(diagnosis_dto_1.CalculationSummaryDto, { formulaId: 'CHILD_PUGH', status: childPugh.status, explanation: childPugh.explanation, missingFields: childPugh.missingFields }, { excludeExtraneousValues: true }),
            (0, class_transformer_1.plainToInstance)(diagnosis_dto_1.CalculationSummaryDto, { formulaId: 'MELD_3_0', status: meld3.status, explanation: meld3.explanation, missingFields: meld3.missingFields }, { excludeExtraneousValues: true }),
            (0, class_transformer_1.plainToInstance)(diagnosis_dto_1.CalculationSummaryDto, { formulaId: 'MELD_NA', status: meldNa.status, explanation: meldNa.explanation, missingFields: meldNa.missingFields }, { excludeExtraneousValues: true }),
            (0, class_transformer_1.plainToInstance)(diagnosis_dto_1.CalculationSummaryDto, { formulaId: 'ALBI', status: albi.status, explanation: albi.explanation, missingFields: albi.missingFields }, { excludeExtraneousValues: true }),
            (0, class_transformer_1.plainToInstance)(diagnosis_dto_1.CalculationSummaryDto, { formulaId: 'BCLC_2022', status: bclc.status, explanation: bclc.explanation, missingFields: bclc.missingFields }, { excludeExtraneousValues: true }),
        ];
        return { diagnosis: toDto(updated), calculations };
    }
};
exports.DiagnosisService = DiagnosisService;
exports.DiagnosisService = DiagnosisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], DiagnosisService);
