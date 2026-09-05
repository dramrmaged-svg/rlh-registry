export type CalculationStatus = 'CALCULATED' | 'NOT_CALCULABLE' | 'OVERRIDDEN';

export interface CalculationResult<T> {
  value: T | null;
  status: CalculationStatus;
  formulaVersion: string;
  sourceFields: string[];
  missingFields: string[];
  explanation: string;
}

export function notCalculable<T>(
  formulaVersion: string,
  sourceFields: string[],
  missingFields: string[],
  explanation: string,
): CalculationResult<T> {
  return { value: null, status: 'NOT_CALCULABLE', formulaVersion, sourceFields, missingFields, explanation };
}

export function calculated<T>(
  value: T,
  formulaVersion: string,
  sourceFields: string[],
  explanation: string,
): CalculationResult<T> {
  return { value, status: 'CALCULATED', formulaVersion, sourceFields, missingFields: [], explanation };
}
