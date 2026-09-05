import { Injectable, HttpStatus } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { PatchDiagnosisDto } from './dto/patch-diagnosis.dto';
import { RecalculateDiagnosisDto } from './dto/recalculate-diagnosis.dto';
import { DiagnosisDto, CalculationSummaryDto } from './dto/diagnosis.dto';
import type { UserResponseDto } from '../users/dto/user-response.dto';
import type { Role } from '@prisma/client';
import type { Request } from 'express';
import { ApiException } from '../common/filters/global-exception.filter';
import { throwNotFound, throwOptimisticLockConflict } from '../common/helpers/conflict.helper';
import { buildChangedFields } from '../common/helpers/changed-fields.helper';
import { serializeDecimals } from '../common/helpers/decimal.helper';
import { calculateChildPugh, calculateMeld3, calculateMeldNa, calculateAlbi, calculateBclcStage, recordCalculationAudit, type BclcStageValue } from '../calculations';

const CALC_ENGINE_VERSION = 'phase1-calc-engine-1.0.0';

function toDto(record: Record<string, unknown>): DiagnosisDto {
  return plainToInstance(DiagnosisDto, serializeDecimals(record), { excludeExtraneousValues: true });
}

const BCLC_TO_PRISMA_ENUM: Record<BclcStageValue, string> = {
  '0': 'STAGE_0', A: 'STAGE_A', B: 'STAGE_B', C: 'STAGE_C', D: 'STAGE_D',
};

@Injectable()
export class DiagnosisService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async getForEpisode(episodeId: string): Promise<DiagnosisDto> {
    const diagnosis = await this.prisma.diagnosis.findUnique({ where: { episodeId } });
    if (!diagnosis) throwNotFound('Diagnosis', episodeId);
    return toDto(diagnosis);
  }

  async create(episodeId: string, dto: CreateDiagnosisDto, currentUser: UserResponseDto, request: Request): Promise<DiagnosisDto> {
    const episode = await this.prisma.episode.findUnique({ where: { id: episodeId } });
    if (!episode) throwNotFound('Episode', episodeId);
    const existing = await this.prisma.diagnosis.findUnique({ where: { episodeId } });
    if (existing) throw new ApiException(HttpStatus.CONFLICT, 'DUPLICATE_DIAGNOSIS', 'This episode already has a diagnosis record; use PATCH to update it.', { episodeId });

    const created = await this.prisma.withinTransaction(async (tx) => {
      const diagnosis = await tx.diagnosis.create({
        data: {
          episodeId,
          tumourType: dto.tumourType,
          aetiology: dto.aetiology ?? null,
          diagnosisDate: dto.diagnosisDate ? new Date(dto.diagnosisDate) : null,
          histologyConfirmed: dto.histologyConfirmed ?? null,
          confirmedBclcStage: (dto.confirmedBclcStage as never) ?? null,
          bclcOverrideReason: dto.bclcOverrideReason ?? null,
          confirmedTStage: dto.confirmedTStage ?? null,
          confirmedNStage: dto.confirmedNStage ?? null,
          confirmedMStage: dto.confirmedMStage ?? null,
          tnmOverrideReason: dto.tnmOverrideReason ?? null,
          confirmedCpGrade: (dto.confirmedCpGrade as never) ?? null,
          cpOverrideReason: dto.cpOverrideReason ?? null,
          meldOverrideReason: dto.meldOverrideReason ?? null,
          albiOverrideReason: dto.albiOverrideReason ?? null,
          createdById: currentUser.id,
          updatedById: currentUser.id,
        },
      });
      await this.auditService.logInTx(tx, { eventType: 'CREATE', entityType: 'Diagnosis', entityId: diagnosis.id, userId: currentUser.id, roleAtTime: currentUser.role as Role, afterSnapshot: diagnosis as unknown as Record<string, unknown>, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
      return diagnosis;
    }, 'serializable');
    return toDto(created);
  }

  async patch(episodeId: string, dto: PatchDiagnosisDto, currentUser: UserResponseDto, request: Request): Promise<DiagnosisDto> {
    const existing = await this.prisma.diagnosis.findUnique({ where: { episodeId } });
    if (!existing) throwNotFound('Diagnosis', episodeId);
    const updated = await this.prisma.withinTransaction(async (tx) => {
      const result = await tx.diagnosis.updateMany({
        where: { episodeId, version: dto.version, deletedAt: null },
        data: {
          ...(dto.tumourType !== undefined && { tumourType: dto.tumourType }),
          ...(dto.aetiology !== undefined && { aetiology: dto.aetiology }),
          ...(dto.diagnosisDate !== undefined && { diagnosisDate: dto.diagnosisDate === null ? null : new Date(dto.diagnosisDate) }),
          ...(dto.histologyConfirmed !== undefined && { histologyConfirmed: dto.histologyConfirmed }),
          ...(dto.confirmedBclcStage !== undefined && { confirmedBclcStage: dto.confirmedBclcStage as never }),
          ...(dto.bclcOverrideReason !== undefined && { bclcOverrideReason: dto.bclcOverrideReason }),
          ...(dto.confirmedTStage !== undefined && { confirmedTStage: dto.confirmedTStage }),
          ...(dto.confirmedNStage !== undefined && { confirmedNStage: dto.confirmedNStage }),
          ...(dto.confirmedMStage !== undefined && { confirmedMStage: dto.confirmedMStage }),
          ...(dto.tnmOverrideReason !== undefined && { tnmOverrideReason: dto.tnmOverrideReason }),
          ...(dto.confirmedCpGrade !== undefined && { confirmedCpGrade: dto.confirmedCpGrade as never }),
          ...(dto.cpOverrideReason !== undefined && { cpOverrideReason: dto.cpOverrideReason }),
          ...(dto.meldOverrideReason !== undefined && { meldOverrideReason: dto.meldOverrideReason }),
          ...(dto.albiOverrideReason !== undefined && { albiOverrideReason: dto.albiOverrideReason }),
          updatedById: currentUser.id,
          version: { increment: 1 },
        },
      });
      if (result.count === 0) {
        const current = await tx.diagnosis.findUnique({ where: { episodeId }, select: { version: true, deletedAt: true } });
        if (!current || current.deletedAt !== null) throwNotFound('Diagnosis', episodeId);
        throwOptimisticLockConflict({ entityType: 'Diagnosis', entityId: existing.id, submittedVersion: dto.version, currentVersion: current.version });
      }
      const fresh = await tx.diagnosis.findUnique({ where: { episodeId } });
      if (!fresh) throwNotFound('Diagnosis', episodeId);
      await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'Diagnosis', entityId: existing.id, userId: currentUser.id, roleAtTime: currentUser.role as Role, beforeSnapshot: existing as unknown as Record<string, unknown>, afterSnapshot: fresh as unknown as Record<string, unknown>, changedFields: buildChangedFields(existing as unknown as Record<string, unknown>, fresh as unknown as Record<string, unknown>, dto as unknown as Record<string, unknown>), ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: null });
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
  async recalculate(episodeId: string, dto: RecalculateDiagnosisDto, currentUser: UserResponseDto, request: Request): Promise<{ diagnosis: DiagnosisDto; calculations: CalculationSummaryDto[] }> {
    const existing = await this.prisma.diagnosis.findUnique({ where: { episodeId } });
    if (!existing) throwNotFound('Diagnosis', episodeId);
    const episode = await this.prisma.episode.findUnique({ where: { id: episodeId }, include: { patient: { select: { sex: true } } } });
    if (!episode) throwNotFound('Episode', episodeId);

    const sex = dto.sex ?? episode.patient.sex;
    const childPugh = calculateChildPugh({ bilirubinUmolL: dto.bilirubinUmolL, albuminGL: dto.albuminGL, inr: dto.inr, ascites: dto.ascites, encephalopathy: dto.encephalopathy });
    const meld3 = calculateMeld3({ bilirubinUmolL: dto.bilirubinUmolL, sodiumMmolL: dto.sodiumMmolL, inr: dto.inr, creatinineUmolL: dto.creatinineUmolL, albuminGL: dto.albuminGL, sex, onDialysis: dto.onDialysis });
    const meldNa = calculateMeldNa({ bilirubinUmolL: dto.bilirubinUmolL, sodiumMmolL: dto.sodiumMmolL, inr: dto.inr, creatinineUmolL: dto.creatinineUmolL, albuminGL: dto.albuminGL, sex, onDialysis: dto.onDialysis });
    const albi = calculateAlbi({ bilirubinUmolL: dto.bilirubinUmolL, albuminGL: dto.albuminGL });
    const bclc = calculateBclcStage({ tumourCount: dto.tumourCount, largestDiameterCm: dto.largestDiameterCm, childPughGrade: childPugh.status === 'CALCULATED' ? childPugh.value?.grade : undefined, ecogScore: dto.ecogScore, pvtt: dto.pvtt, extrahepaticSpread: dto.extrahepaticSpread });

    const updated = await this.prisma.withinTransaction(async (tx) => {
      const diagnosis = await tx.diagnosis.update({
        where: { episodeId },
        data: {
          ...(childPugh.status === 'CALCULATED' && { calculatedCpScore: childPugh.value!.score, calculatedCpGrade: childPugh.value!.grade as never }),
          ...(meld3.status === 'CALCULATED' && { calculatedMeld3Score: meld3.value! }),
          ...(meldNa.status === 'CALCULATED' && { calculatedMeldNaScore: meldNa.value! }),
          ...(albi.status === 'CALCULATED' && { calculatedAlbiScore: albi.value!.score, calculatedAlbiGrade: albi.value!.grade }),
          ...(bclc.status === 'CALCULATED' && { calculatedBclcStage: BCLC_TO_PRISMA_ENUM[bclc.value!] as never }),
          calculationVersion: CALC_ENGINE_VERSION,
          updatedById: currentUser.id,
          version: { increment: 1 },
        },
      });
      await recordCalculationAudit(tx, { entityType: 'Diagnosis', entityId: diagnosis.id, formulaId: 'CHILD_PUGH', result: childPugh, inputsSnapshot: { bilirubinUmolL: dto.bilirubinUmolL, albuminGL: dto.albuminGL, inr: dto.inr, ascites: dto.ascites, encephalopathy: dto.encephalopathy }, calculatedById: currentUser.id });
      await recordCalculationAudit(tx, { entityType: 'Diagnosis', entityId: diagnosis.id, formulaId: 'MELD_3_0', result: meld3, inputsSnapshot: { bilirubinUmolL: dto.bilirubinUmolL, sodiumMmolL: dto.sodiumMmolL, inr: dto.inr, creatinineUmolL: dto.creatinineUmolL, albuminGL: dto.albuminGL, sex, onDialysis: dto.onDialysis }, calculatedById: currentUser.id });
      await recordCalculationAudit(tx, { entityType: 'Diagnosis', entityId: diagnosis.id, formulaId: 'MELD_NA', result: meldNa, inputsSnapshot: { bilirubinUmolL: dto.bilirubinUmolL, sodiumMmolL: dto.sodiumMmolL, inr: dto.inr, creatinineUmolL: dto.creatinineUmolL, albuminGL: dto.albuminGL, sex, onDialysis: dto.onDialysis }, calculatedById: currentUser.id });
      await recordCalculationAudit(tx, { entityType: 'Diagnosis', entityId: diagnosis.id, formulaId: 'ALBI', result: albi, inputsSnapshot: { bilirubinUmolL: dto.bilirubinUmolL, albuminGL: dto.albuminGL }, calculatedById: currentUser.id });
      await recordCalculationAudit(tx, { entityType: 'Diagnosis', entityId: diagnosis.id, formulaId: 'BCLC_2022', result: bclc, inputsSnapshot: { tumourCount: dto.tumourCount, largestDiameterCm: dto.largestDiameterCm, childPughGrade: childPugh.status === 'CALCULATED' ? childPugh.value?.grade : undefined, ecogScore: dto.ecogScore, pvtt: dto.pvtt, extrahepaticSpread: dto.extrahepaticSpread }, calculatedById: currentUser.id });
      await this.auditService.logInTx(tx, { eventType: 'UPDATE', entityType: 'Diagnosis', entityId: diagnosis.id, userId: currentUser.id, roleAtTime: currentUser.role as Role, beforeSnapshot: existing as unknown as Record<string, unknown>, afterSnapshot: diagnosis as unknown as Record<string, unknown>, changedFields: null, ipAddress: request.ip ?? null, userAgent: request.headers['user-agent'] ?? null, metadata: { action: 'recalculate' } });
      return diagnosis;
    });

    const calculations: CalculationSummaryDto[] = [
      plainToInstance(CalculationSummaryDto, { formulaId: 'CHILD_PUGH', status: childPugh.status, explanation: childPugh.explanation, missingFields: childPugh.missingFields }, { excludeExtraneousValues: true }),
      plainToInstance(CalculationSummaryDto, { formulaId: 'MELD_3_0', status: meld3.status, explanation: meld3.explanation, missingFields: meld3.missingFields }, { excludeExtraneousValues: true }),
      plainToInstance(CalculationSummaryDto, { formulaId: 'MELD_NA', status: meldNa.status, explanation: meldNa.explanation, missingFields: meldNa.missingFields }, { excludeExtraneousValues: true }),
      plainToInstance(CalculationSummaryDto, { formulaId: 'ALBI', status: albi.status, explanation: albi.explanation, missingFields: albi.missingFields }, { excludeExtraneousValues: true }),
      plainToInstance(CalculationSummaryDto, { formulaId: 'BCLC_2022', status: bclc.status, explanation: bclc.explanation, missingFields: bclc.missingFields }, { excludeExtraneousValues: true }),
    ];
    return { diagnosis: toDto(updated), calculations };
  }
}
