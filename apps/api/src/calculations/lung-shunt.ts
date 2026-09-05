import { CalculationResult, calculated, notCalculable } from './types';

/** Faithful port of the legacy app's `calcLungRisk()` (line ~6617). */
export const LUNG_SHUNT_FORMULA_VERSION = 'LEGACY_CALC_LUNG_RISK_v105';

export type LungShuntRiskBand = 'LOW' | 'BORDERLINE' | 'HIGH' | 'VERY_HIGH' | 'EXTREME';

export interface LungShuntInput {
  lungShuntFractionPercent?: number | null;
}

export function calculateLungShuntRiskBand(input: LungShuntInput): CalculationResult<LungShuntRiskBand> {
  const v = input.lungShuntFractionPercent;
  if (v === null || v === undefined || !Number.isFinite(v) || v <= 0) {
    return notCalculable(LUNG_SHUNT_FORMULA_VERSION, ['lungShuntFractionPercent'], ['lungShuntFractionPercent'], 'Lung shunt fraction (%) is required.');
  }
  let band: LungShuntRiskBand;
  let explanation: string;
  if (v < 5) { band = 'LOW'; explanation = 'Low (<5%)'; }
  else if (v < 10) { band = 'BORDERLINE'; explanation = 'Borderline (5-10%)'; }
  else if (v < 15) { band = 'HIGH'; explanation = 'High (10-15%)'; }
  else if (v < 20) { band = 'VERY_HIGH'; explanation = 'Very High (15-20%)'; }
  else { band = 'EXTREME'; explanation = 'Extreme - likely contraindication (>20%)'; }
  return calculated(band, LUNG_SHUNT_FORMULA_VERSION, ['lungShuntFractionPercent'], explanation);
}
