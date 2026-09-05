import { calculateMeld3, calculateMeldNa } from './meld';

/** Independent reference implementation of the documented MELD-3.0 formula, used to verify the exported function without importing its internals. */
function referenceMeld3(bili: number, alb: number, inr: number, cr: number, na: number, sex: 'MALE' | 'FEMALE', onDialysis = false): number {
  const b = Math.max(bili / 17.1, 1);
  const a = Math.min(Math.max(alb / 10, 1.5), 3.5);
  const i = Math.max(inr, 1);
  const c = onDialysis ? 3 : Math.min(Math.max(cr / 88.4, 1), 3);
  const n = Math.min(Math.max(na, 125), 137);
  const f = sex === 'FEMALE' ? 1.33 : 0;
  const raw = f + 4.56 * Math.log(b) + 0.82 * (137 - n) - 0.24 * (137 - n) * Math.log(b) + 9.09 * Math.log(i) + 11.14 * Math.log(c) + 1.85 * (3.5 - a) - 1.83 * (3.5 - a) * Math.log(c) + 6;
  return Math.round(Math.min(Math.max(raw, 6), 40));
}

describe('calculateMeld3', () => {
  const baseInput = { bilirubinUmolL: 40, sodiumMmolL: 130, inr: 1.5, creatinineUmolL: 100, albuminGL: 30, sex: 'MALE' as const };

  it('matches the documented MELD-3.0 formula', () => {
    const result = calculateMeld3(baseInput);
    expect(result.status).toBe('CALCULATED');
    expect(result.value).toBe(referenceMeld3(40, 30, 1.5, 100, 130, 'MALE'));
  });

  it('applies the female sex coefficient only when sex is exactly FEMALE', () => {
    const female = calculateMeld3({ ...baseInput, sex: 'FEMALE' });
    const male = calculateMeld3({ ...baseInput, sex: 'MALE' });
    expect(female.value).toBe(referenceMeld3(40, 30, 1.5, 100, 130, 'FEMALE'));
    expect(female.value).not.toBe(male.value);
  });

  it('reproduces the legacy "unset sex treated as male" behaviour (flagged, not silently fixed)', () => {
    const unset = calculateMeld3({ ...baseInput, sex: undefined });
    const male = calculateMeld3({ ...baseInput, sex: 'MALE' });
    expect(unset.value).toBe(male.value);
  });

  it('forces the creatinine component to its ceiling when onDialysis is true', () => {
    const dialysis = calculateMeld3({ ...baseInput, creatinineUmolL: 50, onDialysis: true });
    expect(dialysis.value).toBe(referenceMeld3(40, 30, 1.5, 50, 130, 'MALE', true));
    // The dialysis override forces creatinine to the ceiling (3 mg/dL-equivalent)
    // regardless of the low measured value, matching the legacy `dial==="Yes"` rule.
    const noDialysisSameCreatinine = calculateMeld3({ ...baseInput, creatinineUmolL: 50, onDialysis: false });
    expect(dialysis.value).toBeGreaterThan(noDialysisSameCreatinine.value as number);
  });

  it('clamps the result to [6, 40]', () => {
    const veryMild = calculateMeld3({ bilirubinUmolL: 5, sodiumMmolL: 140, inr: 0.9, creatinineUmolL: 40, albuminGL: 45, sex: 'MALE' });
    expect(veryMild.value).toBeGreaterThanOrEqual(6);
  });

  it('is NOT_CALCULABLE when any required input is missing or non-positive', () => {
    expect(calculateMeld3({ ...baseInput, bilirubinUmolL: null }).status).toBe('NOT_CALCULABLE');
    expect(calculateMeld3({ ...baseInput, sodiumMmolL: 0 }).status).toBe('NOT_CALCULABLE');
  });
});

describe('calculateMeldNa', () => {
  it('applies the classic MELD-Na correction on top of MELD-3.0 — preserved exactly as found in the legacy app', () => {
    const bili = 40, alb = 30, inr = 1.5, cr = 100, na = 130;
    const input = { bilirubinUmolL: bili, sodiumMmolL: na, inr, creatinineUmolL: cr, albuminGL: alb, sex: 'MALE' as const };
    const m3 = referenceMeld3(bili, alb, inr, cr, na, 'MALE');
    // NOTE: this reference deliberately reproduces the flagged double
    // sodium-adjustment (MELD-Na correction applied to an already
    // sodium-adjusted MELD-3.0 score) — the "expected" value here IS the
    // suspected-buggy legacy output, asserted intentionally so any future
    // change to this behaviour is a conscious, reviewed decision rather
    // than an accidental regression. See docs/adr/0001-episode-architecture.md.
    const expectedMeldNa = Math.round((m3 + 1.32 * (137 - na) - 0.033 * m3 * (137 - na)) * 10) / 10;
    const result = calculateMeldNa(input);
    expect(result.status).toBe('CALCULATED');
    expect(result.value).toBe(expectedMeldNa);
    expect(result.formulaVersion).toContain('DOUBLE_SODIUM_ADJUSTMENT_UNVERIFIED');
  });

  it('uses the raw (unclamped) sodium value in the correction step, not the 125-137 clamped value used inside MELD-3.0', () => {
    // Sodium below the MELD-3.0 clamp floor (125) — MELD-3.0 itself clamps
    // to 125, but the MELD-Na correction must still use the raw value (120).
    const input = { bilirubinUmolL: 40, sodiumMmolL: 120, inr: 1.5, creatinineUmolL: 100, albuminGL: 30, sex: 'MALE' as const };
    const m3 = calculateMeld3(input).value as number;
    const expectedWithRawNa = Math.round((m3 + 1.32 * (137 - 120) - 0.033 * m3 * (137 - 120)) * 10) / 10;
    const expectedWithClampedNa = Math.round((m3 + 1.32 * (137 - 125) - 0.033 * m3 * (137 - 125)) * 10) / 10;
    const result = calculateMeldNa(input);
    expect(result.value).toBe(expectedWithRawNa);
    expect(result.value).not.toBe(expectedWithClampedNa);
  });

  it('is NOT_CALCULABLE when any required input is missing', () => {
    const result = calculateMeldNa({ bilirubinUmolL: null, sodiumMmolL: 130, inr: 1.5, creatinineUmolL: 100, albuminGL: 30 });
    expect(result.status).toBe('NOT_CALCULABLE');
  });
});
