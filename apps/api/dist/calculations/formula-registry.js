"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FORMULA_REGISTRY = void 0;
const age_1 = require("./age");
const bmi_1 = require("./bmi");
const child_pugh_1 = require("./child-pugh");
const meld_1 = require("./meld");
const albi_1 = require("./albi");
const bclc_1 = require("./bclc");
const lung_shunt_1 = require("./lung-shunt");
/**
 * Single place that owns the mapping from a stable `formulaId` (used in
 * `CalculationAudit.formulaId`) to its current implementation and version
 * string. Phase 2+ services write to `CalculationAudit` by looking up the
 * entry here rather than hardcoding formula versions inline.
 */
exports.FORMULA_REGISTRY = {
    AGE: { version: age_1.AGE_FORMULA_VERSION, fn: age_1.calculateAge },
    BMI: { version: bmi_1.BMI_FORMULA_VERSION, fn: bmi_1.calculateBmi },
    BSA_MOSTELLER: { version: bmi_1.BSA_FORMULA_VERSION, fn: bmi_1.calculateBsaMosteller },
    CHILD_PUGH: { version: child_pugh_1.CHILD_PUGH_FORMULA_VERSION, fn: child_pugh_1.calculateChildPugh },
    MELD_3_0: { version: meld_1.MELD3_FORMULA_VERSION, fn: meld_1.calculateMeld3 },
    MELD_NA: { version: meld_1.MELD_NA_FORMULA_VERSION, fn: meld_1.calculateMeldNa },
    ALBI: { version: albi_1.ALBI_FORMULA_VERSION, fn: albi_1.calculateAlbi },
    BCLC_2022: { version: bclc_1.BCLC_FORMULA_VERSION, fn: bclc_1.calculateBclcStage },
    LUNG_SHUNT_RISK_BAND: { version: lung_shunt_1.LUNG_SHUNT_FORMULA_VERSION, fn: lung_shunt_1.calculateLungShuntRiskBand },
};
