/**
 * Controlled vocabularies for the extractor. Declared as `as const` tuples so
 * the same list drives TypeScript types, SQLite CHECK constraints (see
 * store/migrations) and the field-mapping generator — one definition, no drift.
 */

export const VALUE_STATUSES = [
  'EXTRACTED',
  'CALCULATED',
  'AI_INFERRED',
  'CLINICIAN_VERIFIED',
  'CONFLICT',
  'NOT_DOCUMENTED',
  'UNCERTAIN',
] as const;
export type ValueStatus = (typeof VALUE_STATUSES)[number];

export const VERIFICATION_STATUSES = ['UNVERIFIED', 'VERIFIED', 'CORRECTED', 'REJECTED'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

/** How a value came to exist. Immutable once written. */
export const EXTRACTION_METHODS = [
  'DIRECT_TEXT_RULE',
  'PDF_TEXT_RULE',
  'OCR_RULE',
  'MANUAL_ENTRY',
  'CALCULATION',
  'AI_SUGGESTION',
] as const;
export type ExtractionMethod = (typeof EXTRACTION_METHODS)[number];

/** Ordered by preference: index 0 is the most preferred capture method. */
export const CAPTURE_METHODS = [
  'DIRECT_TEXT_COPY',
  'EXPORTED_TEXT',
  'EXPORTED_PDF_TEXT',
  'MANUAL_PASTE',
  'SCREENSHOT_OCR',
] as const;
export type CaptureMethod = (typeof CAPTURE_METHODS)[number];

export const DOCUMENT_CLASSES = [
  'BASELINE_CT',
  'BASELINE_MRI',
  'MDT',
  'PATHOLOGY',
  'MAPPING_ANGIOGRAPHY',
  'MAA_ADMINISTRATION',
  'MAA_SPECT_CT',
  'DOSIMETRY_PLAN',
  'Y90_TREATMENT',
  'POST_Y90_PET_CT',
  'POST_Y90_SPECT_CT',
  'FOLLOWUP_CT',
  'FOLLOWUP_MRI',
  'LABS',
  'OTHER',
  'UNCERTAIN',
] as const;
export type DocumentClass = (typeof DOCUMENT_CLASSES)[number];

export const TREATMENT_INTENTS = [
  'RADIATION_SEGMENTECTOMY',
  'LOBAR',
  'RADIATION_LOBECTOMY',
  'STAGED_BILOBAR',
  'PALLIATIVE',
  'OTHER',
  'UNCERTAIN',
] as const;
export type TreatmentIntent = (typeof TREATMENT_INTENTS)[number];

/** Follow-up windows are derived from the actual interval, never forced onto exact dates. */
export const FOLLOW_UP_WINDOWS = ['EARLY', 'M3', 'M6', 'M9', 'M12', 'LATE'] as const;
export type FollowUpWindow = (typeof FOLLOW_UP_WINDOWS)[number];

export const VESSEL_ROLES = [
  'TARGET',
  'TUMOUR_FEEDER',
  'VARIANT',
  'EMBOLISED',
  'MAA_INJECTION',
  'Y90_ADMINISTRATION',
] as const;
export type VesselRole = (typeof VESSEL_ROLES)[number];

export const LAB_CONTEXTS = ['BASELINE', 'PRE_MAPPING', 'PRE_Y90', 'FOLLOW_UP', 'OTHER'] as const;
export type LabContext = (typeof LAB_CONTEXTS)[number];

export const COMPLETENESS_STATES = ['COMPLETE', 'MISSING', 'UNCERTAIN', 'CONFLICT'] as const;
export type CompletenessState = (typeof COMPLETENESS_STATES)[number];

/** Fixed label carried by every AI output. Not configurable. */
export const AI_OUTPUT_LABEL = 'AI_GENERATED_CLINICIAN_REVIEW_REQUIRED' as const;

/** Entity types that can own field values. Must match table names in the store. */
export const ENTITY_TYPES = [
  'patient',
  'sirt_episode',
  'study',
  'baseline_assessment',
  'tumour_lesion',
  'treatment_territory',
  'mapping_procedure',
  'procedure_vessel',
  'maa_study',
  'dosimetry_plan',
  'y90_treatment',
  'y90_administration',
  'post_treatment_dosimetry',
  'follow_up_episode',
  'lesion_follow_up',
  'laboratory_episode',
  'complication',
  'subsequent_treatment',
  'outcome',
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

/** SQL `IN (...)` list for a vocabulary, used in CHECK constraints. */
export function sqlInList(values: readonly string[]): string {
  return values.map((v) => `'${v.replace(/'/g, "''")}'`).join(', ');
}
