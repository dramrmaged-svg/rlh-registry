"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGE_FORMULA_VERSION = void 0;
exports.calculateAge = calculateAge;
const types_1 = require("./types");
/**
 * Faithful port of the legacy app's `calcAge()` (line ~6595). Age is computed
 * as of the treatment date if given, otherwise as of today. Whole years only,
 * using calendar year/month/day comparison (not day-count division).
 */
exports.AGE_FORMULA_VERSION = 'LEGACY_CALC_AGE_v105';
function calculateAge(input) {
    if (!input.dateOfBirth) {
        return (0, types_1.notCalculable)(exports.AGE_FORMULA_VERSION, ['dateOfBirth', 'asOfDate'], ['dateOfBirth'], 'Date of birth is required to calculate age.');
    }
    const dob = new Date(input.dateOfBirth);
    if (Number.isNaN(dob.getTime())) {
        return (0, types_1.notCalculable)(exports.AGE_FORMULA_VERSION, ['dateOfBirth', 'asOfDate'], ['dateOfBirth'], 'Date of birth is not a valid date.');
    }
    const ref = input.asOfDate ? new Date(input.asOfDate) : new Date();
    if (Number.isNaN(ref.getTime())) {
        return (0, types_1.notCalculable)(exports.AGE_FORMULA_VERSION, ['dateOfBirth', 'asOfDate'], ['asOfDate'], 'Reference date is not a valid date.');
    }
    let age = ref.getFullYear() - dob.getFullYear();
    const monthDiff = ref.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < dob.getDate()))
        age--;
    return (0, types_1.calculated)(age, exports.AGE_FORMULA_VERSION, ['dateOfBirth', 'asOfDate'], `Age computed as whole years between date of birth and ${input.asOfDate ? 'the reference date' : "today's date"}.`);
}
