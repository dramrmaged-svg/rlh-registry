import { calculateChildPugh } from './child-pugh';

describe('calculateChildPugh', () => {
  it('grades A at the exact score-6 boundary', () => {
    const result = calculateChildPugh({ bilirubinUmolL: 20, albuminGL: 40, inr: 1.0, ascites: '1', encephalopathy: '2' });
    expect(result.status).toBe('CALCULATED');
    expect(result.value?.score).toBe(6);
    expect(result.value?.grade).toBe('A');
  });

  it('grades B at the exact score-7 boundary (A/B transition)', () => {
    const result = calculateChildPugh({ bilirubinUmolL: 20, albuminGL: 40, inr: 1.0, ascites: '2', encephalopathy: '2' });
    expect(result.value?.score).toBe(7);
    expect(result.value?.grade).toBe('B');
  });

  it('grades B at the exact score-9 boundary', () => {
    const result = calculateChildPugh({ bilirubinUmolL: 40, albuminGL: 30, inr: 1.0, ascites: '2', encephalopathy: '2' });
    expect(result.value?.score).toBe(9);
    expect(result.value?.grade).toBe('B');
  });

  it('grades C at the exact score-10 boundary (B/C transition)', () => {
    const result = calculateChildPugh({ bilirubinUmolL: 40, albuminGL: 30, inr: 2.0, ascites: '2', encephalopathy: '2' });
    expect(result.value?.score).toBe(10);
    expect(result.value?.grade).toBe('C');
  });

  it('calculates from exactly 2 of 5 components (faithful legacy behaviour) and flags the reduced input count', () => {
    const result = calculateChildPugh({ bilirubinUmolL: 20, albuminGL: 40, inr: null, ascites: null, encephalopathy: null });
    expect(result.status).toBe('CALCULATED');
    expect(result.value?.componentsUsed).toBe(2);
    expect(result.explanation).toMatch(/only 2\/5 components/);
  });

  it('is NOT_CALCULABLE with only 1 of 5 components', () => {
    const result = calculateChildPugh({ bilirubinUmolL: 20, albuminGL: null, inr: null, ascites: null, encephalopathy: null });
    expect(result.status).toBe('NOT_CALCULABLE');
    expect(result.value).toBeNull();
  });

  it('is NOT_CALCULABLE with 0 components', () => {
    const result = calculateChildPugh({});
    expect(result.status).toBe('NOT_CALCULABLE');
  });

  it('parses free-text ascites/encephalopathy severity, matching the legacy combobox parser', () => {
    const none = calculateChildPugh({ bilirubinUmolL: 20, albuminGL: 40, inr: 1.0, ascites: 'None', encephalopathy: 'none' });
    expect(none.value?.score).toBe(1 + 1 + 1 + 1 + 1); // all points = 1

    const severe = calculateChildPugh({ bilirubinUmolL: 20, albuminGL: 40, inr: 1.0, ascites: 'Moderate', encephalopathy: 'Grade 3' });
    expect(severe.value?.score).toBe(1 + 1 + 1 + 3 + 3);
  });
});
