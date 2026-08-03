"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHILD_PUGH_FORMULA_VERSION = void 0;
exports.calculateChildPugh = calculateChildPugh;
const types_1 = require("./types");
/**
 * Faithful port of the legacy app's `calcCP()` (line ~6515), including the
 * `parseComboCP()` free-text parser for ascites/encephalopathy and the
 * documented clinical risk: a class is computed from as few as 2 of the 5
 * components. This is NOT silently fixed — `componentsUsed` is exposed
 * specifically so callers/UI can surface that risk (see
 * docs/adr/0001-episode-architecture.md).
 */
exports.CHILD_PUGH_FORMULA_VERSION = 'LEGACY_CALC_CP_v105';
function parseComboCP(value) {
    if (!value)
        return 0;
    const v = value.trim();
    const n = parseInt(v, 10);
    if (n >= 1 && n <= 3)
        return n;
    if (/none|no/i.test(v))
        return 1;
    if (/mild|grade\s*1|grade\s*2|controlled/i.test(v))
        return 2;
    if (/moderate|severe|grade\s*3|grade\s*4|refractory/i.test(v))
        return 3;
    return 0;
}
function calculateChildPugh(input) {
    const sourceFields = ['bilirubinUmolL', 'albuminGL', 'inr', 'ascites', 'encephalopathy'];
    const bili = input.bilirubinUmolL;
    const alb = input.albuminGL;
    const inr = input.inr;
    const bP = bili !== null && bili !== undefined && Number.isFinite(bili) && bili > 0 ? (bili < 34 ? 1 : bili <= 51 ? 2 : 3) : 0;
    const aP = alb !== null && alb !== undefined && Number.isFinite(alb) && alb > 0 ? (alb > 35 ? 1 : alb >= 28 ? 2 : 3) : 0;
    const iP = inr !== null && inr !== undefined && Number.isFinite(inr) && inr > 0 ? (inr < 1.7 ? 1 : inr <= 2.3 ? 2 : 3) : 0;
    const asc = parseComboCP(input.ascites);
    const enc = parseComboCP(input.encephalopathy);
    const componentsUsed = [bP, aP, iP, asc, enc].filter((v) => v > 0).length;
    if (componentsUsed < 2) {
        const missingFields = sourceFields.filter((f, i) => [bP, aP, iP, asc, enc][i] === 0);
        return (0, types_1.notCalculable)(exports.CHILD_PUGH_FORMULA_VERSION, sourceFields, missingFields, 'At least 2 of 5 components (bilirubin, albumin, INR, ascites, encephalopathy) are required.');
    }
    const score = bP + aP + iP + asc + enc;
    const grade = score <= 6 ? 'A' : score <= 9 ? 'B' : 'C';
    const explanation = componentsUsed < 5
        ? `Computed from only ${componentsUsed}/5 components (legacy behaviour, ported faithfully) — treat this result with caution; a class based on partial input can misrepresent the patient's true Child-Pugh grade.`
        : 'Computed from all 5 standard components (bilirubin, albumin, INR, ascites, encephalopathy).';
    return (0, types_1.calculated)({ score, grade, componentsUsed }, exports.CHILD_PUGH_FORMULA_VERSION, sourceFields, explanation);
}
