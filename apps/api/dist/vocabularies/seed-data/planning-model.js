"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLANNING_MODEL = void 0;
// Verbatim from the legacy app's #dl-planningModel datalist (line ~3593).
exports.PLANNING_MODEL = {
    key: 'PLANNING_MODEL',
    label: 'Dosimetry planning model',
    options: [
        { code: 'BSA', label: 'BSA' },
        { code: 'PARTITION', label: 'Partition' },
        { code: 'MIRD', label: 'MIRD' },
        { code: 'VOXEL_BASED', label: 'Voxel-based' },
    ],
};
