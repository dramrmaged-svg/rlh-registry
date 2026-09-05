"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MDT_DECISION = void 0;
// Mirrors the existing hardcoded MDT_DECISIONS const in
// apps/api/src/mdt/dto/{create-mdt-record,patch-mdt-record}.dto.ts (left
// untouched this phase for scope discipline — see
// docs/adr/0001-episode-architecture.md). Seeded here so future
// modules/reporting have one consistent vocabulary to reference; migrating
// the MDT DTOs to @IsVocabularyCode is a low-risk follow-up, not done here.
exports.MDT_DECISION = {
    key: 'MDT_DECISION',
    label: 'MDT decision',
    options: [
        { code: 'SIRT', label: 'SIRT' },
        { code: 'MWA_ABLATION', label: 'MWA Ablation' },
        { code: 'RFA_ABLATION', label: 'RFA Ablation' },
        { code: 'TACE', label: 'TACE' },
        { code: 'TAE', label: 'TAE' },
        { code: 'SYSTEMIC_THERAPY', label: 'Systemic Therapy' },
        { code: 'BEST_SUPPORTIVE_CARE', label: 'Best Supportive Care' },
        { code: 'SURGICAL_RESECTION', label: 'Surgical Resection' },
        { code: 'TRANSPLANT_ASSESSMENT', label: 'Transplant Assessment' },
        { code: 'ACTIVE_SURVEILLANCE', label: 'Active Surveillance' },
        { code: 'RE_DISCUSS', label: 'Re-discuss' },
        { code: 'DECLINED', label: 'Declined' },
        { code: 'OTHER', label: 'Other' },
    ],
};
