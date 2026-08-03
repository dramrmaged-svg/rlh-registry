"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OUTCOME_STATUS = void 0;
// Verbatim from the legacy app's #dl-outcomeStatus datalist (line ~4157).
exports.OUTCOME_STATUS = {
    key: 'OUTCOME_STATUS',
    label: 'Outcome status',
    options: [
        { code: 'ALIVE', label: 'Alive' },
        { code: 'DIED_LIVER_DISEASE', label: 'Died — liver disease' },
        { code: 'DIED_OTHER', label: 'Died — other' },
        { code: 'LOST_TO_FOLLOW_UP', label: 'Lost to follow-up' },
        { code: 'TRANSPLANTED', label: 'Transplanted' },
    ],
};
