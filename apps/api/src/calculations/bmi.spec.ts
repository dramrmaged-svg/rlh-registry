import { calculateBmi, calculateBsaMosteller } from './bmi';

describe('calculateBmi', () => {
  it('categorises Underweight below 18.5', () => {
    const result = calculateBmi({ heightCm: 170, weightKg: 50 });
    expect(result.status).toBe('CALCULATED');
    expect(result.value?.category).toBe('Underweight');
  });

  it('categorises Normal at exactly 18.5', () => {
    const heightM = 1.7;
    const weightKg = 18.5 * heightM * heightM;
    const result = calculateBmi({ heightCm: 170, weightKg });
    expect(result.value?.category).toBe('Normal');
  });

  it('categorises Overweight at exactly 25', () => {
    const heightM = 1.7;
    const weightKg = 25 * heightM * heightM;
    const result = calculateBmi({ heightCm: 170, weightKg });
    expect(result.value?.category).toBe('Overweight');
  });

  it('categorises Obese at exactly 30', () => {
    const heightM = 1.7;
    const weightKg = 30 * heightM * heightM;
    const result = calculateBmi({ heightCm: 170, weightKg });
    expect(result.value?.category).toBe('Obese');
  });

  it('is NOT_CALCULABLE with missing or non-positive inputs', () => {
    expect(calculateBmi({ heightCm: null, weightKg: 70 }).status).toBe('NOT_CALCULABLE');
    expect(calculateBmi({ heightCm: 170, weightKg: 0 }).status).toBe('NOT_CALCULABLE');
    expect(calculateBmi({ heightCm: -170, weightKg: 70 }).status).toBe('NOT_CALCULABLE');
  });
});

describe('calculateBsaMosteller', () => {
  it('computes BSA via the Mosteller formula', () => {
    const result = calculateBsaMosteller({ heightCm: 180, weightKg: 80 });
    expect(result.status).toBe('CALCULATED');
    expect(result.value).toBeCloseTo(Math.sqrt((180 * 80) / 3600), 6);
  });

  it('is NOT_CALCULABLE with missing inputs', () => {
    expect(calculateBsaMosteller({ heightCm: null, weightKg: 80 }).status).toBe('NOT_CALCULABLE');
  });
});
