"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALBI_FORMULA_VERSION = void 0;
exports.calculateAlbi = calculateAlbi;
const types_1 = require("./types");
/** Faithful port of the legacy app's ALBI calculation inside `calcCP()` (line ~6584). */
exports.ALBI_FORMULA_VERSION = 'LEGACY_CALC_ALBI_v105';
function calculateAlbi(input) {
    const bili = input.bilirubinUmolL;
    const alb = input.albuminGL;
    const missing = [];
    if (bili === null || bili === undefined || !Number.isFinite(bili) || bili <= 0)
        missing.push('bilirubinUmolL');
    if (alb === null || alb === undefined || !Number.isFinite(alb) || alb <= 0)
        missing.push('albuminGL');
    if (missing.length > 0) {
        return (0, types_1.notCalculable)(exports.ALBI_FORMULA_VERSION, ['bilirubinUmolL', 'albuminGL'], missing, 'Bilirubin and albumin (both > 0) are required to calculate the ALBI score.');
    }
    const score = Math.log10(bili) * 0.66 + alb * -0.085;
    const grade = score <= -2.6 ? 1 : score <= -1.39 ? 2 : 3;
    return (0, types_1.calculated)({ score, grade }, exports.ALBI_FORMULA_VERSION, ['bilirubinUmolL', 'albuminGL'], 'ALBI score = (log10(bilirubin µmol/L) x 0.66) + (albumin g/L x -0.085). Grade 1 <= -2.60, Grade 2 <= -1.39, else Grade 3.');
}
