import { calculateAge, AGE_FORMULA_VERSION } from './age';
import { calculateBmi, calculateBsaMosteller, BMI_FORMULA_VERSION, BSA_FORMULA_VERSION } from './bmi';
import { calculateChildPugh, CHILD_PUGH_FORMULA_VERSION } from './child-pugh';
import { calculateMeld3, calculateMeldNa, MELD3_FORMULA_VERSION, MELD_NA_FORMULA_VERSION } from './meld';
import { calculateAlbi, ALBI_FORMULA_VERSION } from './albi';
import { calculateBclcStage, BCLC_FORMULA_VERSION } from './bclc';
import { calculateLungShuntRiskBand, LUNG_SHUNT_FORMULA_VERSION } from './lung-shunt';

/**
 * Single place that owns the mapping from a stable `formulaId` (used in
 * `CalculationAudit.formulaId`) to its current implementation and version
 * string. Phase 2+ services write to `CalculationAudit` by looking up the
 * entry here rather than hardcoding formula versions inline.
 */
export const FORMULA_REGISTRY = {
  AGE: { version: AGE_FORMULA_VERSION, fn: calculateAge },
  BMI: { version: BMI_FORMULA_VERSION, fn: calculateBmi },
  BSA_MOSTELLER: { version: BSA_FORMULA_VERSION, fn: calculateBsaMosteller },
  CHILD_PUGH: { version: CHILD_PUGH_FORMULA_VERSION, fn: calculateChildPugh },
  MELD_3_0: { version: MELD3_FORMULA_VERSION, fn: calculateMeld3 },
  MELD_NA: { version: MELD_NA_FORMULA_VERSION, fn: calculateMeldNa },
  ALBI: { version: ALBI_FORMULA_VERSION, fn: calculateAlbi },
  BCLC_2022: { version: BCLC_FORMULA_VERSION, fn: calculateBclcStage },
  LUNG_SHUNT_RISK_BAND: { version: LUNG_SHUNT_FORMULA_VERSION, fn: calculateLungShuntRiskBand },
} as const;

export type FormulaId = keyof typeof FORMULA_REGISTRY;
