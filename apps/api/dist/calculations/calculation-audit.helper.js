"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordCalculationAudit = recordCalculationAudit;
const formula_registry_1 = require("./formula-registry");
/**
 * Writes a CalculationAudit row for a computed value, inside the caller's
 * transaction. Not wired into any service yet in this phase — no Phase 1
 * endpoint triggers a calculation (Diagnosis/ClinicalScore/LabPanel CRUD is
 * Phase 2) — provided now so Phase 2 services have a single, consistent
 * entry point to call rather than each hand-rolling `tx.calculationAudit.create`.
 */
async function recordCalculationAudit(tx, opts) {
    const registered = formula_registry_1.FORMULA_REGISTRY[opts.formulaId];
    await tx.calculationAudit.create({
        data: {
            entityType: opts.entityType,
            entityId: opts.entityId,
            formulaId: opts.formulaId,
            formulaVersion: registered.version,
            inputsSnapshot: opts.inputsSnapshot,
            result: opts.result,
            status: opts.result.status,
            calculatedById: opts.calculatedById ?? null,
        },
    });
}
