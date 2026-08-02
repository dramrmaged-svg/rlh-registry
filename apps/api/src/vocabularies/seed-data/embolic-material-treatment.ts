// Verbatim from the legacy app's #dl-embolicMaterials datalist (line ~3815) —
// the treatment-procedure embolic material list, distinct from the
// mapping-side list (embolic-material-mapping.ts).
export const EMBOLIC_MATERIAL_TREATMENT = {
  key: 'EMBOLIC_MATERIAL_TREATMENT',
  label: 'Embolic material (treatment)',
  options: [
    { code: 'NONE', label: 'None' },
    { code: 'COILS', label: 'Coils' },
    { code: 'PARTICLES', label: 'Particles' },
    { code: 'COILS_PLUS_PARTICLES', label: 'Coils + particles' },
    { code: 'OTHER', label: 'Other' },
  ],
};
