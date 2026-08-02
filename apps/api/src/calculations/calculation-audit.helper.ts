import type { PrismaTx } from '../prisma/prisma.service';
import type { CalculationResult } from './types';
import type { FormulaId } from './formula-registry';
import { FORMULA_REGISTRY } from './formula-registry';

/**
 * Writes a CalculationAudit row for a computed value, inside the caller's
 * transaction. Not wired into any service yet in this phase — no Phase 1
 * endpoint triggers a calculation (Diagnosis/ClinicalScore/LabPanel CRUD is
 * Phase 2) — provided now so Phase 2 services have a single, consistent
 * entry point to call rather than each hand-rolling `tx.calculationAudit.create`.
 */
export async function recordCalculationAudit<T>(
  tx: PrismaTx,
  opts: {
    entityType: string;
    entityId: string;
    formulaId: FormulaId;
    result: CalculationResult<T>;
    inputsSnapshot: Record<string, unknown>;
    calculatedById?: string | null;
  },
): Promise<void> {
  const registered = FORMULA_REGISTRY[opts.formulaId];
  await tx.calculationAudit.create({
    data: {
      entityType: opts.entityType,
      entityId: opts.entityId,
      formulaId: opts.formulaId,
      formulaVersion: registered.version,
      inputsSnapshot: opts.inputsSnapshot as never,
      result: opts.result as unknown as never,
      status: opts.result.status,
      calculatedById: opts.calculatedById ?? null,
    },
  });
}
