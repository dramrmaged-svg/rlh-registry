import { calculateAlbi } from './albi';

function biliForScore(score: number, albuminGL: number): number {
  // Inverse of score = log10(bili)*0.66 + albuminGL*(-0.085)
  return Math.pow(10, (score + albuminGL * 0.085) / 0.66);
}

describe('calculateAlbi', () => {
  it('matches the documented ALBI formula', () => {
    const result = calculateAlbi({ bilirubinUmolL: 25, albuminGL: 38 });
    expect(result.status).toBe('CALCULATED');
    expect(result.value?.score).toBeCloseTo(Math.log10(25) * 0.66 + 38 * -0.085, 10);
  });

  it('grades 1 (Low) at and below the -2.60 boundary', () => {
    const alb = 35;
    const bili = biliForScore(-2.6, alb);
    const result = calculateAlbi({ bilirubinUmolL: bili, albuminGL: alb });
    expect(result.value?.score).toBeCloseTo(-2.6, 6);
    expect(result.value?.grade).toBe(1);
  });

  it('grades 2 (Intermediate) just above the -2.60 boundary', () => {
    const alb = 35;
    const bili = biliForScore(-2.6, alb) * 1.01; // pushes score slightly above -2.60
    const result = calculateAlbi({ bilirubinUmolL: bili, albuminGL: alb });
    expect(result.value?.grade).toBe(2);
  });

  it('grades 2 (Intermediate) at the -1.39 boundary', () => {
    const alb = 35;
    const bili = biliForScore(-1.39, alb);
    const result = calculateAlbi({ bilirubinUmolL: bili, albuminGL: alb });
    expect(result.value?.score).toBeCloseTo(-1.39, 6);
    expect(result.value?.grade).toBe(2);
  });

  it('grades 3 (High) just above the -1.39 boundary', () => {
    const alb = 35;
    const bili = biliForScore(-1.39, alb) * 1.01;
    const result = calculateAlbi({ bilirubinUmolL: bili, albuminGL: alb });
    expect(result.value?.grade).toBe(3);
  });

  it('is NOT_CALCULABLE when bilirubin or albumin is missing or non-positive', () => {
    expect(calculateAlbi({ bilirubinUmolL: null, albuminGL: 35 }).status).toBe('NOT_CALCULABLE');
    expect(calculateAlbi({ bilirubinUmolL: 25, albuminGL: 0 }).status).toBe('NOT_CALCULABLE');
  });
});
