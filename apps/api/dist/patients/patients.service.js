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
exports.PatientsService = void 0;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const patient_detail_dto_1 = require("./dto/patient-detail.dto");
const patient_summary_dto_1 = require("./dto/patient-summary.dto");
const global_exception_filter_1 = require("../common/filters/global-exception.filter");
const conflict_helper_1 = require("../common/helpers/conflict.helper");
const changed_fields_helper_1 = require("../common/helpers/changed-fields.helper");
const duplicate_token_store_1 = require("./duplicate-token.store");
function encodeCursor(data) { return Buffer.from(JSON.stringify(data)).toString('base64url'); }
function decodeCursor(cursor) { try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
}
catch {
    return null;
} }
function toDetailDto(patient) { return (0, class_transformer_1.plainToInstance)(patient_detail_dto_1.PatientDetailDto, patient, { excludeExtraneousValues: true }); }
function toSummaryDto(patient) { return (0, class_transformer_1.plainToInstance)(patient_summary_dto_1.PatientSummaryDto, patient, { excludeExtraneousValues: true }); }
// Diagnosis moved to episode-scoped (see docs/adr/0001-episode-architecture.md)
// — there is no single patient-level diagnosis anymore. "Primary diagnosis"
// for list/detail display is derived from the most recent episode's
// Diagnosis, preferring the clinician-confirmed BCLC stage over the
// calculated one.
function extractPrimaryDiagnosis(episodes) {
    const latest = episodes?.[0];
    if (!latest?.diagnosis)
        return null;
    return { id: latest.diagnosis.id, episodeId: latest.id, tumourType: latest.diagnosis.tumourType, bclcStage: latest.diagnosis.confirmedBclcStage ?? latest.diagnosis.calculatedBclcStage ?? null };
}
const LATEST_EPISODE_DIAGNOSIS_INCLUDE = {
    orderBy: { episodeNumber: 'desc' },
    take: 1,
    include: { diagnosis: { select: { id: true, tumourType: true, calculatedBclcStage: true, confirmedBclcStage: true } } },
};
let PatientsService = class PatientsService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async list(query) {
        const limit = query.limit ?? 25;
        const sortBy = query.sortBy ?? 'lastName';
        const sortOrder = query.sortOrder ?? 'asc';
        const where = { isActive: query.isActive ?? true };
        if (query.search && query.search.length >= 2) {
            where['OR'] = [{ lastName: { contains: query.search, mode: 'insensitive' } }, { firstName: { contains: query.search, mode: 'insensitive' } }];
        }
        if (query.cursor) {
            const decoded = decodeCursor(query.cursor);
            if (decoded) {
                const op = sortOrder === 'asc' ? 'gt' : 'lt';
                where['OR'] = [{ [sortBy]: { [op]: decoded.sortValue } }, { [sortBy]: { equals: decoded.sortValue }, id: { [op]: decoded.id } }];
            }
        }
        const patients = await this.prisma.patient.findMany({ where, take: limit + 1, orderBy: [{ [sortBy]: sortOrder }, { id: sortOrder }], include: { identifiers: { where: { isPrimary: true, isActive: true }, take: 1 }, episodes: LATEST_EPISODE_DIAGNOSIS_INCLUDE } });
        const hasMore = patients.length > limit;
        const page = hasMore ? patients.slice(0, limit) : patients;
        const lastItem = page[page.length - 1];
        const nextCursor = hasMore && lastItem ? encodeCursor({ sortValue: String(lastItem[sortBy] ?? ''), id: lastItem.id }) : null;
        return { data: page.map((p) => toSummaryDto({ ...p, primaryDiagnosis: extractPrimaryDiagnosis(p.episodes), primaryIdentifier: p.identifiers?.[0] ?? null, lastMdtDecision: null, lastProcedureDate: null })), pagination: { limit, nextCursor, hasMore } };
    }
    async getById(id) {
        const patient = await this.prisma.patient.findUnique({ where: { id }, include: { identifiers: { where: { isActive: true } }, episodes: LATEST_EPISODE_DIAGNOSIS_INCLUDE } });
        if (!patient)
            (0, conflict_helper_1.throwNotFound)('Patient', id);
        return toDetailDto({ ...patient, primaryDiagnosis: extractPrimaryDiagnosis(patient.episodes) });
    }
    async create(dto, currentUser, request) {
        const nhsNumber = dto.primaryIdentifier?.identifierType === 'NHS_NUMBER' ? dto.primaryIdentifier.value : undefined;
        if (nhsNumber) {
            const existing = await this.prisma.patientIdentifier.findFirst({ where: { identifierType: 'NHS_NUMBER', value: nhsNumber } });
            if (existing)
                throw new global_exception_filter_1.ApiException(common_1.HttpStatus.CONFLICT, 'DUPLICATE_IDENTIFIER', 'This NHS number is already registered to another patient', { existingPatientId: existing.patientId });
        }
        if (!dto.duplicateConfirmation) {
            const fuzzyMatches = await this.findFuzzyMatches(dto.lastName, dto.dateOfBirth, nhsNumber);
            if (fuzzyMatches.length > 0) {
                const { token, expiresAt } = (0, duplicate_token_store_1.issueToken)({ firstName: dto.firstName, lastName: dto.lastName, dateOfBirth: dto.dateOfBirth, nhsNumber, reviewedMatchCount: fuzzyMatches.length });
                return { status: 'DUPLICATE_WARNING', confirmationToken: token, tokenExpiresAt: expiresAt.toISOString(), potentialMatches: fuzzyMatches.map((m) => ({ lastName: m.lastName, dateOfBirth: m.dateOfBirth, nhsNumberPartial: this.maskNhsNumber(m.nhsNumber), primaryDiagnosisTumourType: m.tumourType ?? null })) };
            }
        }
        if (dto.duplicateConfirmation) {
            const tokenResult = (0, duplicate_token_store_1.validateAndConsumeToken)(dto.duplicateConfirmation.token, { firstName: dto.firstName, lastName: dto.lastName, dateOfBirth: dto.dateOfBirth, nhsNumber });
            if (!tokenResult)
                throw new global_exception_filter_1.ApiException(common_1.HttpStatus.BAD_REQUEST, 'DUPLICATE_CONFIRMATION_TOKEN_INVALID', 'Confirmation token is invalid, expired, or does not match the submitted patient data.');
        }
        const patient = await this.prisma.withinTransaction(async (tx) => {
            const created = await tx.patient.create({ data: { firstName: dto.firstName, lastName: dto.lastName, dateOfBirth: new Date(dto.dateOfBirth), sex: dto.sex, ethnicity: dto.ethnicity ?? null, gpPractice: dto.gpPractice ?? null, referringHospital: dto.referringHospital ?? null, createdById: currentUser.id, updatedById: currentUser.id }, include: { identifiers: true } });
            if (dto.primaryIdentifier) {
                await tx.patientIdentifier.create({ data: { patientId: created.id, identifierType: dto.primaryIdentifier.identifierType, value: dto.primaryIdentifier.value, issuingOrg: dto.primaryIdentifier.issuingOrg ?? null, isPrimary: true, isActive: true, createdById: currentUser.id } });
            }
            await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'Patient', entityId: created.id, userId: currentUser.id, roleAtTime: currentUser.role, afterSnapshot: created, metadata: dto.duplicateConfirmation ? { duplicateConfirmed: true, reviewedMatchCount: dto.duplicateConfirmation.reviewedMatchCount, confirmationNote: dto.duplicateConfirmation.confirmationNote } : null, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null });
            return created;
        }, 'read-committed');
        return { status: 'CREATED', patient: await this.getById(patient.id) };
    }
    async patch(id, dto, currentUser, request) {
        const existing = await this.prisma.patient.findUnique({ where: { id } });
        if (!existing)
            (0, conflict_helper_1.throwNotFound)('Patient', id);
        const updated = await this.prisma.withinTransaction(async (tx) => {
            const result = await tx.patient.updateMany({ where: { id, version: dto.version, deletedAt: null }, data: { ...(dto.firstName !== undefined && { firstName: dto.firstName }), ...(dto.lastName !== undefined && { lastName: dto.lastName }), ...(dto.dateOfBirth !== undefined && { dateOfBirth: new Date(dto.dateOfBirth) }), ...(dto.sex !== undefined && { sex: dto.sex }), ...(dto.ethnicity !== undefined && { ethnicity: dto.ethnicity }), ...(dto.gpPractice !== undefined && { gpPractice: dto.gpPractice }), ...(dto.referringHospital !== undefined && { referringHospital: dto.referringHospital }), updatedById: currentUser.id, version: { increment: 1 } } });
            if (result.count === 0) {
                const current = await tx.patient.findUnique({ where: { id }, select: { version: true, deletedAt: true } });
                if (current !== null && current.deletedAt !== null)
                    (0, conflict_helper_1.throwNotFound)('Patient', id);
                if (current === null)
                    (0, conflict_helper_1.throwNotFound)('Patient', id);
                (0, conflict_helper_1.throwOptimisticLockConflict)({ entityType: 'Patient', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
            }
            const fresh = await tx.patient.findUnique({ where: { id }, include: { identifiers: { where: { isActive: true } } } });
            if (!fresh)
                (0, conflict_helper_1.throwNotFound)('Patient', id);
            await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'Patient', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role, beforeSnapshot: existing, afterSnapshot: fresh, changedFields: (0, changed_fields_helper_1.buildChangedFields)(existing, fresh, dto), ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
            return fresh;
        });
        return this.getById(updated.id);
    }
    async findFuzzyMatches(lastName, dateOfBirth, nhsNumber) {
        void nhsNumber;
        const matches = await this.prisma.patient.findMany({ where: { dateOfBirth: new Date(dateOfBirth), lastName: { contains: lastName.slice(0, 4), mode: 'insensitive' }, isActive: true }, include: { identifiers: { where: { identifierType: 'NHS_NUMBER', isActive: true }, take: 1 }, episodes: { orderBy: { episodeNumber: 'desc' }, take: 1, select: { diagnosis: { select: { tumourType: true } } } } }, take: 5 });
        return matches.map((m) => ({ lastName: m.lastName, dateOfBirth: m.dateOfBirth, nhsNumber: m.identifiers?.[0]?.value ?? null, tumourType: m.episodes?.[0]?.diagnosis?.tumourType ?? null }));
    }
    maskNhsNumber(value) {
        if (!value)
            return '??? *** ****';
        const digits = value.replace(/\s/g, '');
        return `${digits.slice(0, 3)} *** ****`;
    }
};
exports.PatientsService = PatientsService;
exports.PatientsService = PatientsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], PatientsService);
