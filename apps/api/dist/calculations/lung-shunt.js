"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LUNG_SHUNT_FORMULA_VERSION = void 0;
exports.calculateLungShuntRiskBand = calculateLungShuntRiskBand;
const types_1 = require("./types");
/** Faithful port of the legacy app's `calcLungRisk()` (line ~6617). */
exports.LUNG_SHUNT_FORMULA_VERSION = 'LEGACY_CALC_LUNG_RISK_v105';
function calculateLungShuntRiskBand(input) {
    const v = input.lungShuntFractionPercent;
    if (v === null || v === undefined || !Number.isFinite(v) || v <= 0) {
        return (0, types_1.notCalculable)(exports.LUNG_SHUNT_FORMULA_VERSION, ['lungShuntFractionPercent'], ['lungShuntFractionPercent'], 'Lung shunt fraction (%) is required.');
    }
    let band;
    let explanation;
    if (v < 5) {
        band = 'LOW';
        explanation = 'Low (<5%)';
    }
    else if (v < 10) {
        band = 'BORDERLINE';
        explanation = 'Borderline (5-10%)';
    }
    else if (v < 15) {
        band = 'HIGH';
        explanation = 'High (10-15%)';
    }
    else if (v < 20) {
        band = 'VERY_HIGH';
        explanation = 'Very High (15-20%)';
    }
    else {
        band = 'EXTREME';
        explanation = 'Extreme - likely contraindication (>20%)';
    }
    return (0, types_1.calculated)(band, exports.LUNG_SHUNT_FORMULA_VERSION, ['lungShuntFractionPercent'], explanation);
}
