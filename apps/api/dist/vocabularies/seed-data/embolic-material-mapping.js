"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMBOLIC_MATERIAL_MAPPING = void 0;
// Verbatim from the legacy app's #dl-embolicMap datalist (line ~3503) — the
// mapping-procedure embolic material list, distinct from the treatment-side
// list (embolic-material-treatment.ts).
exports.EMBOLIC_MATERIAL_MAPPING = {
    key: 'EMBOLIC_MATERIAL_MAPPING',
    label: 'Embolic material (mapping)',
    options: [
        { code: 'NA', label: 'NA' },
        { code: 'DETACHABLE_COILS', label: 'Detachable coils' },
        { code: 'PUSHABLE_COILS', label: 'Pushable Coils' },
        { code: 'CALIBRATED_PARTICLES', label: 'Calibrated Particles' },
        { code: 'Y90', label: 'Y90' },
        { code: 'PUSHABLE_COILS_AND_CALIBRATED_PARTICLES', label: 'Pushable coils & Calibrated Particles' },
        { code: 'EMBO_CUBE_2_5MG_MERIT', label: 'Embo Cube 2.5 mg Merit' },
        { code: 'GELFOAM', label: 'Gelfoam' },
        { code: 'EMBOSPHERE_PARTICLES_40_120_MICRON', label: 'Embosphere Particles 40-120 Micron' },
        { code: 'EMBOCEPT', label: 'Embocept' },
        { code: 'MICRO_VASCULAR_PLUG', label: 'Micro vascular plug' },
        { code: 'RESORBABLE_PARTICLES', label: 'Resorbable particles' },
    ],
};
