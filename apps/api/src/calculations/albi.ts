import { CalculationResult, calculated, notCalculable } from './types';

/** Faithful port of the legacy app's ALBI calculation inside `calcCP()` (line ~6584). */
export const ALBI_FORMULA_VERSION = 'LEGACY_CALC_ALBI_v105';

export interface AlbiInput {
  bilirubinUmolL?: number | null;
  albuminGL?: number | null;
}

export interface AlbiOutput {
  score: number;
  grade: 1 | 2 | 3;
}

export function calculateAlbi(input: AlbiInput): CalculationResult<AlbiOutput> {
  const bili = input.bilirubinUmolL;
  const alb = input.albuminGL;
  const missing: string[] = [];
  if (bili === null || bili === undefined || !Number.isFinite(bili) || bili <= 0) missing.push('bilirubinUmolL');
  if (alb === null || alb === undefined || !Number.isFinite(alb) || alb <= 0) missing.push('albuminGL');
  if (missing.length > 0) {
    return notCalculable(ALBI_FORMULA_VERSION, ['bilirubinUmolL', 'albuminGL'], missing, 'Bilirubin and albumin (both > 0) are required to calculate the ALBI score.');
  }
  const score = Math.log10(bili as number) * 0.66 + (alb as number) * -0.085;
  const grade: 1 | 2 | 3 = score <= -2.6 ? 1 : score <= -1.39 ? 2 : 3;
  return calculated({ score, grade }, ALBI_FORMULA_VERSION, ['bilirubinUmolL', 'albuminGL'], 'ALBI score = (log10(bilirubin µmol/L) x 0.66) + (albumin g/L x -0.085). Grade 1 <= -2.60, Grade 2 <= -1.39, else Grade 3.');
}
