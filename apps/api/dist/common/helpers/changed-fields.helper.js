"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildChangedFields = buildChangedFields;
function buildChangedFields(before, after, dto) {
    const result = {};
    for (const key of Object.keys(dto)) {
        if (dto[key] === undefined)
            continue;
        if (key === 'version')
            continue;
        result[key] = { before: before[key], after: after[key] };
    }
    return result;
}
