import { calculateLungShuntRiskBand } from './lung-shunt';

describe('calculateLungShuntRiskBand', () => {
  it.each([
    [4.9, 'LOW'],
    [5, 'BORDERLINE'],
    [9.9, 'BORDERLINE'],
    [10, 'HIGH'],
    [14.9, 'HIGH'],
    [15, 'VERY_HIGH'],
    [19.9, 'VERY_HIGH'],
    [20, 'EXTREME'],
    [25, 'EXTREME'],
  ])('bands %p%% as %p', (value, band) => {
    const result = calculateLungShuntRiskBand({ lungShuntFractionPercent: value as number });
    expect(result.status).toBe('CALCULATED');
    expect(result.value).toBe(band);
  });

  it('is NOT_CALCULABLE for missing or non-positive values', () => {
    expect(calculateLungShuntRiskBand({ lungShuntFractionPercent: null }).status).toBe('NOT_CALCULABLE');
    expect(calculateLungShuntRiskBand({ lungShuntFractionPercent: 0 }).status).toBe('NOT_CALCULABLE');
    expect(calculateLungShuntRiskBand({ lungShuntFractionPercent: -1 }).status).toBe('NOT_CALCULABLE');
  });
});
