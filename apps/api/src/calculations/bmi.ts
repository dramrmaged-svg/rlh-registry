import { CalculationResult, calculated, notCalculable } from './types';

/** Faithful port of the legacy app's `calcBMI()` (line ~6607). */
export const BMI_FORMULA_VERSION = 'LEGACY_CALC_BMI_v105';

export type BmiCategory = 'Underweight' | 'Normal' | 'Overweight' | 'Obese';

export interface BmiInput {
  heightCm?: number | null;
  weightKg?: number | null;
}

export interface BmiOutput {
  bmi: number;
  category: BmiCategory;
}

export function calculateBmi(input: BmiInput): CalculationResult<BmiOutput> {
  const ht = input.heightCm;
  const wt = input.weightKg;
  const missing: string[] = [];
  if (ht === null || ht === undefined || !Number.isFinite(ht) || ht <= 0) missing.push('heightCm');
  if (wt === null || wt === undefined || !Number.isFinite(wt) || wt <= 0) missing.push('weightKg');
  if (missing.length > 0) {
    return notCalculable(BMI_FORMULA_VERSION, ['heightCm', 'weightKg'], missing, 'Height and weight (both > 0) are required to calculate BMI.');
  }
  const bmi = (wt as number) / (((ht as number) / 100) * ((ht as number) / 100));
  const category: BmiCategory = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
  return calculated({ bmi, category }, BMI_FORMULA_VERSION, ['heightCm', 'weightKg'], `BMI = weight(kg) / height(m)^2. Category thresholds: <18.5 Underweight, <25 Normal, <30 Overweight, else Obese.`);
}

/**
 * Standard Mosteller body-surface-area formula. NOT ported from the legacy
 * app: the legacy source only had "BSA" as an unimplemented dosimetry
 * planning-model label (a later patch even auto-renamed/retired it in favour
 * of "MIRD single-compartment model" — see line ~28503 of the legacy file),
 * with no working BSA calculator behind it. This is the standard published
 * Mosteller formula, not a legacy-behavior-parity port.
 */
export const BSA_FORMULA_VERSION = 'STANDARD_MOSTELLER_1.0';

export interface BsaInput {
  heightCm?: number | null;
  weightKg?: number | null;
}

export function calculateBsaMosteller(input: BsaInput): CalculationResult<number> {
  const ht = input.heightCm;
  const wt = input.weightKg;
  const missing: string[] = [];
  if (ht === null || ht === undefined || !Number.isFinite(ht) || ht <= 0) missing.push('heightCm');
  if (wt === null || wt === undefined || !Number.isFinite(wt) || wt <= 0) missing.push('weightKg');
  if (missing.length > 0) {
    return notCalculable(BSA_FORMULA_VERSION, ['heightCm', 'weightKg'], missing, 'Height and weight (both > 0) are required to calculate BSA.');
  }
  const bsa = Math.sqrt(((ht as number) * (wt as number)) / 3600);
  return calculated(bsa, BSA_FORMULA_VERSION, ['heightCm', 'weightKg'], 'BSA (m^2) = sqrt(height(cm) x weight(kg) / 3600) — Mosteller formula.');
}
