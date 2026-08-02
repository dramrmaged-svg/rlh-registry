// Verbatim from the legacy app's #dl-progressionReason datalist (line ~4176).
export const PROGRESSION_REASON = {
  key: 'PROGRESSION_REASON',
  label: 'Progression reason',
  options: [
    { code: 'NEW_INTRAHEPATIC_LESIONS', label: 'New intrahepatic lesion(s)' },
    { code: 'GROWTH_RESIDUAL_VIABLE', label: 'Growth of treated lesion(s) — residual viable tumour' },
    { code: 'GROWTH_RECURRENCE_TREATED_SEGMENT', label: 'Growth of treated lesion(s) — recurrence in treated segment' },
    { code: 'NEW_EXTRAHEPATIC_LYMPH_NODE', label: 'New extrahepatic lesion(s) — lymph node' },
    { code: 'NEW_EXTRAHEPATIC_LUNG', label: 'New extrahepatic lesion(s) — lung' },
    { code: 'NEW_EXTRAHEPATIC_BONE', label: 'New extrahepatic lesion(s) — bone' },
    { code: 'NEW_EXTRAHEPATIC_PERITONEAL', label: 'New extrahepatic lesion(s) — peritoneal' },
    { code: 'NEW_EXTRAHEPATIC_ADRENAL', label: 'New extrahepatic lesion(s) — adrenal' },
    { code: 'NEW_EXTRAHEPATIC_OTHER', label: 'New extrahepatic lesion(s) — other' },
    { code: 'VASCULAR_INVASION_PORTAL_VEIN', label: 'Vascular invasion progression — portal vein' },
    { code: 'VASCULAR_INVASION_HEPATIC_VEIN', label: 'Vascular invasion progression — hepatic vein' },
    { code: 'BIOCHEMICAL_ONLY', label: 'Biochemical progression only (AFP/CEA/CA19-9 rise)' },
    { code: 'COMBINED_INTRA_EXTRAHEPATIC', label: 'Combined intrahepatic + extrahepatic progression' },
    { code: 'INDETERMINATE_AWAITING_IMAGING', label: 'Indeterminate / awaiting imaging' },
  ],
};
