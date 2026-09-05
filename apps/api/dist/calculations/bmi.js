"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BSA_FORMULA_VERSION = exports.BMI_FORMULA_VERSION = void 0;
exports.calculateBmi = calculateBmi;
exports.calculateBsaMosteller = calculateBsaMosteller;
const types_1 = require("./types");
/** Faithful port of the legacy app's `calcBMI()` (line ~6607). */
exports.BMI_FORMULA_VERSION = 'LEGACY_CALC_BMI_v105';
function calculateBmi(input) {
    const ht = input.heightCm;
    const wt = input.weightKg;
    const missing = [];
    if (ht === null || ht === undefined || !Number.isFinite(ht) || ht <= 0)
        missing.push('heightCm');
    if (wt === null || wt === undefined || !Number.isFinite(wt) || wt <= 0)
        missing.push('weightKg');
    if (missing.length > 0) {
        return (0, types_1.notCalculable)(exports.BMI_FORMULA_VERSION, ['heightCm', 'weightKg'], missing, 'Height and weight (both > 0) are required to calculate BMI.');
    }
    const bmi = wt / ((ht / 100) * (ht / 100));
    const category = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
    return (0, types_1.calculated)({ bmi, category }, exports.BMI_FORMULA_VERSION, ['heightCm', 'weightKg'], `BMI = weight(kg) / height(m)^2. Category thresholds: <18.5 Underweight, <25 Normal, <30 Overweight, else Obese.`);
}
/**
 * Standard Mosteller body-surface-area formula. NOT ported from the legacy
 * app: the legacy source only had "BSA" as an unimplemented dosimetry
 * planning-model label (a later patch even auto-renamed/retired it in favour
 * of "MIRD single-compartment model" — see line ~28503 of the legacy file),
 * with no working BSA calculator behind it. This is the standard published
 * Mosteller formula, not a legacy-behavior-parity port.
 */
exports.BSA_FORMULA_VERSION = 'STANDARD_MOSTELLER_1.0';
function calculateBsaMosteller(input) {
    const ht = input.heightCm;
    const wt = input.weightKg;
    const missing = [];
    if (ht === null || ht === undefined || !Number.isFinite(ht) || ht <= 0)
        missing.push('heightCm');
    if (wt === null || wt === undefined || !Number.isFinite(wt) || wt <= 0)
        missing.push('weightKg');
    if (missing.length > 0) {
        return (0, types_1.notCalculable)(exports.BSA_FORMULA_VERSION, ['heightCm', 'weightKg'], missing, 'Height and weight (both > 0) are required to calculate BSA.');
    }
    const bsa = Math.sqrt((ht * wt) / 3600);
    return (0, types_1.calculated)(bsa, exports.BSA_FORMULA_VERSION, ['heightCm', 'weightKg'], 'BSA (m^2) = sqrt(height(cm) x weight(kg) / 3600) — Mosteller formula.');
}
