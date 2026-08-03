"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notCalculable = notCalculable;
exports.calculated = calculated;
function notCalculable(formulaVersion, sourceFields, missingFields, explanation) {
    return { value: null, status: 'NOT_CALCULABLE', formulaVersion, sourceFields, missingFields, explanation };
}
function calculated(value, formulaVersion, sourceFields, explanation) {
    return { value, status: 'CALCULATED', formulaVersion, sourceFields, missingFields: [], explanation };
}
