"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MELD_NA_FORMULA_VERSION = exports.MELD3_FORMULA_VERSION = void 0;
exports.calculateMeld3 = calculateMeld3;
exports.calculateMeldNa = calculateMeldNa;
const types_1 = require("./types");
/**
 * Faithful port of the legacy app's `calcMELD()` (line ~6628), which
 * implements MELD-3.0 (FMP formula) followed by a MELD-Na correction applied
 * ON TOP of the MELD-3.0 result.
 *
 * FLAGGED FOR CLINICAL VERIFICATION — NOT silently fixed, see
 * docs/adr/0001-episode-architecture.md:
 *  1. `calculateMeldNa` applies the classic 2016 MELD-Na sodium correction
 *     to a MELD-3.0 score that is ALREADY sodium-adjusted (MELD-3.0's own
 *     `0.82*(137-n) - 0.24*(137-n)*ln(b)` terms). This likely double-counts
 *     sodium's contribution and may not be a validated clinical score.
 *  2. Sex coefficient (`f`) is 1.33 only when sex is exactly 'FEMALE';
 *     MALE, INDETERMINATE, UNKNOWN, and missing/undefined sex all silently
 *     receive the non-female coefficient (0) — an unset/unknown sex is
 *     treated as if male.
 *  3. The MELD-Na correction uses the RAW (unclamped) sodium value, not the
 *     125-137 clamped value (`n`) used inside the MELD-3.0 formula itself —
 *     ported exactly as found, not normalized to be internally consistent.
 */
exports.MELD3_FORMULA_VERSION = 'LEGACY_CALC_MELD3_v105';
exports.MELD_NA_FORMULA_VERSION = 'LEGACY_CALC_MELD_NA_v105_DOUBLE_SODIUM_ADJUSTMENT_UNVERIFIED';
const MELD3_SOURCE_FIELDS = ['bilirubinUmolL', 'sodiumMmolL', 'inr', 'creatinineUmolL', 'albuminGL', 'sex', 'onDialysis'];
function meld3Inputs(input) {
    const { bilirubinUmolL: bili, albuminGL: alb, inr: inrV, creatinineUmolL: cr, sodiumMmolL: na } = input;
    const values = [bili, alb, inrV, cr, na];
    if (values.some((v) => v === null || v === undefined || !Number.isFinite(v) || v <= 0))
        return null;
    return { bili: bili, alb: alb, inrV: inrV, cr: cr, na: na };
}
function computeMeld3Raw(v, sex, onDialysis) {
    const b = Math.max(v.bili / 17.1, 1);
    const a = Math.min(Math.max(v.alb / 10, 1.5), 3.5);
    const i = Math.max(v.inrV, 1);
    const c = onDialysis ? 3 : Math.min(Math.max(v.cr / 88.4, 1), 3);
    const n = Math.min(Math.max(v.na, 125), 137);
    const f = sex === 'FEMALE' ? 1.33 : 0;
    const raw = f +
        4.56 * Math.log(b) +
        0.82 * (137 - n) -
        0.24 * (137 - n) * Math.log(b) +
        9.09 * Math.log(i) +
        11.14 * Math.log(c) +
        1.85 * (3.5 - a) -
        1.83 * (3.5 - a) * Math.log(c) +
        6;
    return Math.round(Math.min(Math.max(raw, 6), 40));
}
function calculateMeld3(input) {
    const v = meld3Inputs(input);
    if (!v) {
        return (0, types_1.notCalculable)(exports.MELD3_FORMULA_VERSION, MELD3_SOURCE_FIELDS, ['bilirubinUmolL', 'sodiumMmolL', 'inr', 'creatinineUmolL', 'albuminGL'].filter((f) => {
            const val = input[f];
            return val === null || val === undefined || !Number.isFinite(val) || val <= 0;
        }), 'Bilirubin, sodium, INR, creatinine and albumin (all > 0) are required to calculate MELD-3.0.');
    }
    const m3 = computeMeld3Raw(v, input.sex, input.onDialysis);
    return (0, types_1.calculated)(m3, exports.MELD3_FORMULA_VERSION, MELD3_SOURCE_FIELDS, 'MELD-3.0 (FMP formula), clamped to [6, 40]. See source comments for the unset-sex and dialysis handling ported from the legacy app.');
}
function calculateMeldNa(input) {
    const v = meld3Inputs(input);
    if (!v) {
        return (0, types_1.notCalculable)(exports.MELD_NA_FORMULA_VERSION, MELD3_SOURCE_FIELDS, ['bilirubinUmolL', 'sodiumMmolL', 'inr', 'creatinineUmolL', 'albuminGL'].filter((f) => {
            const val = input[f];
            return val === null || val === undefined || !Number.isFinite(val) || val <= 0;
        }), 'Bilirubin, sodium, INR, creatinine and albumin (all > 0) are required to calculate MELD-Na.');
    }
    const m3 = computeMeld3Raw(v, input.sex, input.onDialysis);
    const mn = Math.round((m3 + 1.32 * (137 - v.na) - 0.033 * m3 * (137 - v.na)) * 10) / 10;
    return (0, types_1.calculated)(mn, exports.MELD_NA_FORMULA_VERSION, MELD3_SOURCE_FIELDS, 'MELD-Na = MELD-3.0 with the classic 2016 sodium correction applied on top — ported faithfully from the legacy app; NOT clinically verified, since MELD-3.0 is already sodium-adjusted (see module doc comment).');
}
