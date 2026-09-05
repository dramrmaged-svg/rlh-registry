import { CalculationResult, calculated, notCalculable } from './types';

/**
 * Faithful port of the legacy app's `calcAge()` (line ~6595). Age is computed
 * as of the treatment date if given, otherwise as of today. Whole years only,
 * using calendar year/month/day comparison (not day-count division).
 */
export const AGE_FORMULA_VERSION = 'LEGACY_CALC_AGE_v105';

export interface AgeInput {
  dateOfBirth?: Date | string | null;
  asOfDate?: Date | string | null;
}

export function calculateAge(input: AgeInput): CalculationResult<number> {
  if (!input.dateOfBirth) {
    return notCalculable(AGE_FORMULA_VERSION, ['dateOfBirth', 'asOfDate'], ['dateOfBirth'], 'Date of birth is required to calculate age.');
  }
  const dob = new Date(input.dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return notCalculable(AGE_FORMULA_VERSION, ['dateOfBirth', 'asOfDate'], ['dateOfBirth'], 'Date of birth is not a valid date.');
  }
  const ref = input.asOfDate ? new Date(input.asOfDate) : new Date();
  if (Number.isNaN(ref.getTime())) {
    return notCalculable(AGE_FORMULA_VERSION, ['dateOfBirth', 'asOfDate'], ['asOfDate'], 'Reference date is not a valid date.');
  }
  let age = ref.getFullYear() - dob.getFullYear();
  const monthDiff = ref.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < dob.getDate())) age--;
  return calculated(age, AGE_FORMULA_VERSION, ['dateOfBirth', 'asOfDate'], `Age computed as whole years between date of birth and ${input.asOfDate ? 'the reference date' : "today's date"}.`);
}
