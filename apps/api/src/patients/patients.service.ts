import { Injectable, HttpStatus } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatchPatientDto } from './dto/patch-patient.dto';
import { PatientListQueryDto } from './dto/patient-list-query.dto';
import { PatientDetailDto } from './dto/patient-detail.dto';
import { PatientSummaryDto } from './dto/patient-summary.dto';
import type { UserResponseDto } from '../users/dto/user-response.dto';
import { ApiException } from '../common/filters/global-exception.filter';
import { throwOptimisticLockConflict, throwNotFound } from '../common/helpers/conflict.helper';
import { buildChangedFields } from '../common/helpers/changed-fields.helper';
import { issueToken, validateAndConsumeToken } from './duplicate-token.store';
import type { Request } from 'express';
import type { Role } from '@prisma/client';

interface CursorData { sortValue: string; id: string }
function encodeCursor(data: CursorData): string { return Buffer.from(JSON.stringify(data)).toString('base64url'); }
function decodeCursor(cursor: string): CursorData | null { try { return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as CursorData; } catch { return null; } }
function toDetailDto(patient: Record<string, unknown>): PatientDetailDto { return plainToInstance(PatientDetailDto, patient, { excludeExtraneousValues: true }); }
function toSummaryDto(patient: Record<string, unknown>): PatientSummaryDto { return plainToInstance(PatientSummaryDto, patient, { excludeExtraneousValues: true }); }

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async list(query: PatientListQueryDto) {
    const limit = query.limit ?? 25;
    const sortBy = query.sortBy ?? 'lastName';
    const sortOrder = query.sortOrder ?? 'asc';
    const where: Record<string, unknown> = { isActive: query.isActive ?? true };
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
    const patients = await this.prisma.patient.findMany({ where, take: limit + 1, orderBy: [{ [sortBy]: sortOrder }, { id: sortOrder }], include: { identifiers: { where: { isPrimary: true, isActive: true }, take: 1 }, diagnoses: { where: { isPrimary: true }, take: 1 } } });
    const hasMore = patients.length > limit;
    const page = hasMore ? patients.slice(0, limit) : patients;
    const lastItem = page[page.length - 1];
    const nextCursor = hasMore && lastItem ? encodeCursor({ sortValue: String(lastItem[sortBy as keyof typeof lastItem] ?? ''), id: lastItem.id }) : null;
    return { data: page.map((p) => toSummaryDto({ ...p, primaryDiagnosis: (p.diagnoses as Array<{ tumourType: string; baselineBclcStage: string | null }>)?.[0] ?? null, primaryIdentifier: (p.identifiers as Array<{ identifierType: string; value: string; isActive: boolean }>)?.[0] ?? null, lastMdtDecision: null, lastProcedureDate: null })), pagination: { limit, nextCursor, hasMore } };
  }

  async getById(id: string): Promise<PatientDetailDto> {
    const patient = await this.prisma.patient.findUnique({ where: { id }, include: { identifiers: { where: { isActive: true } }, diagnoses: { where: { isPrimary: true }, take: 1 } } });
    if (!patient) throwNotFound('Patient', id);
    return toDetailDto({ ...patient, primaryDiagnosis: (patient.diagnoses as Array<{ id: string; tumourType: string; baselineBclcStage: string | null; isPrimary: boolean }>)?.[0] ?? null });
  }

  async create(dto: CreatePatientDto, currentUser: UserResponseDto, request: Request) {
    const nhsNumber = dto.primaryIdentifier?.identifierType === 'NHS_NUMBER' ? dto.primaryIdentifier.value : undefined;
    if (nhsNumber) {
      const existing = await this.prisma.patientIdentifier.findFirst({ where: { identifierType: 'NHS_NUMBER', value: nhsNumber } });
      if (existing) throw new ApiException(HttpStatus.CONFLICT, 'DUPLICATE_IDENTIFIER', 'This NHS number is already registered to another patient', { existingPatientId: existing.patientId });
    }
    if (!dto.duplicateConfirmation) {
      const fuzzyMatches = await this.findFuzzyMatches(dto.lastName, dto.dateOfBirth, nhsNumber);
      if (fuzzyMatches.length > 0) {
        const { token, expiresAt } = issueToken({ firstName: dto.firstName, lastName: dto.lastName, dateOfBirth: dto.dateOfBirth, nhsNumber, reviewedMatchCount: fuzzyMatches.length });
        return { status: 'DUPLICATE_WARNING' as const, confirmationToken: token, tokenExpiresAt: expiresAt.toISOString(), potentialMatches: fuzzyMatches.map((m) => ({ lastName: m.lastName, dateOfBirth: m.dateOfBirth, nhsNumberPartial: this.maskNhsNumber(m.nhsNumber), primaryDiagnosisTumourType: m.tumourType ?? null })) };
      }
    }
    if (dto.duplicateConfirmation) {
      const tokenResult = validateAndConsumeToken(dto.duplicateConfirmation.token, { firstName: dto.firstName, lastName: dto.lastName, dateOfBirth: dto.dateOfBirth, nhsNumber });
      if (!tokenResult) throw new ApiException(HttpStatus.BAD_REQUEST, 'DUPLICATE_CONFIRMATION_TOKEN_INVALID', 'Confirmation token is invalid, expired, or does not match the submitted patient data.');
    }
    const patient = await this.prisma.withinTransaction(async (tx) => {
      const created = await tx.patient.create({ data: { firstName: dto.firstName, lastName: dto.lastName, dateOfBirth: new Date(dto.dateOfBirth), sex: dto.sex as never, ethnicity: dto.ethnicity ?? null, gpPractice: dto.gpPractice ?? null, referringHospital: dto.referringHospital ?? null, createdById: currentUser.id, updatedById: currentUser.id }, include: { identifiers: true, diagnoses: true } });
      if (dto.primaryIdentifier) { await tx.patientIdentifier.create({ data: { patientId: created.id, identifierType: dto.primaryIdentifier.identifierType as never, value: dto.primaryIdentifier.value, issuingOrg: dto.primaryIdentifier.issuingOrg ?? null, isPrimary: true, isActive: true, createdById: currentUser.id } }); }
      await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'Patient', entityId: created.id, userId: currentUser.id, roleAtTime: currentUser.role as Role, afterSnapshot: created as unknown as Record<string, unknown>, metadata: dto.duplicateConfirmation ? { duplicateConfirmed: true, reviewedMatchCount: dto.duplicateConfirmation.reviewedMatchCount, confirmationNote: dto.duplicateConfirmation.confirmationNote } : null, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null });
      return created;
    }, 'read-committed');
    return { status: 'CREATED' as const, patient: await this.getById(patient.id) };
  }

  async patch(id: string, dto: PatchPatientDto, currentUser: UserResponseDto, request: Request): Promise<PatientDetailDto> {
    const existing = await this.prisma.patient.findUnique({ where: { id } });
    if (!existing) throwNotFound('Patient', id);
    const updated = await this.prisma.withinTransaction(async (tx) => {
      const result = await tx.patient.updateMany({ where: { id, version: dto.version, deletedAt: null }, data: { ...(dto.firstName !== undefined && { firstName: dto.firstName }), ...(dto.lastName !== undefined && { lastName: dto.lastName }), ...(dto.dateOfBirth !== undefined && { dateOfBirth: new Date(dto.dateOfBirth) }), ...(dto.sex !== undefined && { sex: dto.sex as never }), ...(dto.ethnicity !== undefined && { ethnicity: dto.ethnicity }), ...(dto.gpPractice !== undefined && { gpPractice: dto.gpPractice }), ...(dto.referringHospital !== undefined && { referringHospital: dto.referringHospital }), updatedById: currentUser.id, version: { increment: 1 } } });
      if (result.count === 0) {
        const current = await tx.patient.findUnique({ where: { id }, select: { version: true, deletedAt: true } });
        if (current !== null && current.deletedAt !== null) throwNotFound('Patient', id);
        if (current === null) throwNotFound('Patient', id);
        throwOptimisticLockConflict({ entityType: 'Patient', entityId: id, submittedVersion: dto.version, currentVersion: current.version });
      }
      const fresh = await tx.patient.findUnique({ where: { id }, include: { identifiers: { where: { isActive: true } }, diagnoses: { where: { isPrimary: true }, take: 1 } } });
      if (!fresh) throwNotFound('Patient', id);
      await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'Patient', entityId: id, userId: currentUser.id, roleAtTime: currentUser.role as Role, beforeSnapshot: existing as unknown as Record<string, unknown>, afterSnapshot: fresh as unknown as Record<string, unknown>, changedFields: buildChangedFields(existing as unknown as Record<string, unknown>, fresh as unknown as Record<string, unknown>, dto as unknown as Record<string, unknown>), ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
      return fresh;
    });
    return this.getById(updated.id);
  }

  private async findFuzzyMatches(lastName: string, dateOfBirth: string, nhsNumber?: string) {
    void nhsNumber;
    const matches = await this.prisma.patient.findMany({ where: { dateOfBirth: new Date(dateOfBirth), lastName: { contains: lastName.slice(0, 4), mode: 'insensitive' }, isActive: true }, include: { identifiers: { where: { identifierType: 'NHS_NUMBER', isActive: true }, take: 1 }, diagnoses: { where: { isPrimary: true }, take: 1, select: { tumourType: true } } }, take: 5 });
    return matches.map((m) => ({ lastName: m.lastName, dateOfBirth: m.dateOfBirth, nhsNumber: (m.identifiers as Array<{ value: string }>)?.[0]?.value ?? null, tumourType: (m.diagnoses as Array<{ tumourType: string }>)?.[0]?.tumourType ?? null }));
  }

  private maskNhsNumber(value: string | null): string {
    if (!value) return '??? *** ****';
    const digits = value.replace(/\s/g, '');
    return `${digits.slice(0, 3)} *** ****`;
  }
}
