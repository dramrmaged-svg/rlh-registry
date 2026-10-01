import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Reads the existing registry's Prisma schema so the field mapping is checked
 * against the real registry, not a hand-copied list that can drift.
 */
export const REGISTRY_SCHEMA_PATH = join(__dirname, '..', '..', '..', 'api', 'prisma', 'schema.prisma');

/** Registry models holding clinical/episode data. Auth, vocabulary and audit infrastructure are out of scope. */
export const REGISTRY_CLINICAL_MODELS = [
  'Patient', 'PatientIdentifier', 'Episode', 'Diagnosis', 'MdtSession', 'MdtRecord', 'ClinicalScore', 'LabPanel',
  'ClinicalSnapshot', 'ImagingStudy', 'Lesion', 'LesionFeeder', 'LesionDoseInjection', 'MappingSession', 'MaaStudy',
  'DosimetryPlan', 'TreatmentSession', 'FollowUp', 'ToxicityEvent', 'EpisodeOutcome',
] as const;

export interface RegistryField {
  model: string;
  field: string;
  type: string;
  optional: boolean;
}

export function parseRegistrySchema(source: string = readFileSync(REGISTRY_SCHEMA_PATH, 'utf8')): RegistryField[] {
  const modelNames = new Set([...source.matchAll(/^model\s+(\w+)\s*\{/gm)].map((m) => m[1]));
  const fields: RegistryField[] = [];
  for (const block of source.matchAll(/^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm)) {
    const model = block[1];
    for (const rawLine of block[2].split('\n')) {
      const line = rawLine.replace(/\/\/.*$/, '').trim();
      if (!line || line.startsWith('@@')) continue;
      const m = /^(\w+)\s+(\w+)(\[\])?(\?)?/.exec(line);
      if (!m) continue;
      const [, field, type, isList] = m;
      if (modelNames.has(type) || isList) continue; // relation navigation, not a column
      fields.push({ model, field, type, optional: m[4] === '?' });
    }
  }
  return fields;
}

export type RegistryOnlyReason =
  | 'SYSTEM'
  | 'FOREIGN_KEY'
  | 'WORKFLOW'
  | 'IDENTIFIABLE_MANUAL'
  | 'CLINICIAN_DECISION'
  | 'REGISTRY_DERIVED'
  | 'FORMULA_NOT_ADOPTED';

const SYSTEM_FIELDS = new Set(['id', 'version', 'deletedAt', 'createdById', 'updatedById', 'createdAt', 'updatedAt']);

/**
 * Registry columns the extractor deliberately does NOT populate, with the
 * reason. Anything not listed here must be targeted by FIELD_CATALOGUE —
 * enforced by registry-mapping.spec.ts.
 */
export const REGISTRY_ONLY: Record<string, { reason: RegistryOnlyReason; note: string }> = {
  'Patient.firstName': { reason: 'IDENTIFIABLE_MANUAL', note: 'Never extracted from reports (data minimisation). Entered in registry.' },
  'Patient.lastName': { reason: 'IDENTIFIABLE_MANUAL', note: 'As above.' },
  'Patient.dateOfBirth': { reason: 'IDENTIFIABLE_MANUAL', note: 'As above.' },
  'Patient.ethnicity': { reason: 'IDENTIFIABLE_MANUAL', note: 'Registry demographic.' },
  'Patient.countryOfBirth': { reason: 'IDENTIFIABLE_MANUAL', note: 'Registry demographic.' },
  'Patient.gpPractice': { reason: 'IDENTIFIABLE_MANUAL', note: 'Registry demographic.' },
  'Patient.gpName': { reason: 'IDENTIFIABLE_MANUAL', note: 'Registry demographic.' },
  'Patient.referringHospital': { reason: 'IDENTIFIABLE_MANUAL', note: 'Registry referral data.' },
  'Patient.referringClinician': { reason: 'IDENTIFIABLE_MANUAL', note: 'Registry referral data.' },
  'Patient.nhsNumberPendingUntil': { reason: 'WORKFLOW', note: 'Registry identifier workflow.' },
  'Patient.isActive': { reason: 'WORKFLOW', note: 'Registry record state.' },
  'PatientIdentifier.identifierType': { reason: 'IDENTIFIABLE_MANUAL', note: 'Matched against extractor patient_identifier at push; never exported.' },
  'PatientIdentifier.value': { reason: 'IDENTIFIABLE_MANUAL', note: 'As above.' },
  'PatientIdentifier.issuingOrg': { reason: 'IDENTIFIABLE_MANUAL', note: 'As above.' },
  'PatientIdentifier.isPrimary': { reason: 'IDENTIFIABLE_MANUAL', note: 'As above.' },
  'PatientIdentifier.isActive': { reason: 'WORKFLOW', note: 'Registry record state.' },
  'Episode.episodeNumber': { reason: 'WORKFLOW', note: 'Matched to sirt_episode.episode_number at push; registry is authoritative.' },
  'Episode.firstOrRepeat': { reason: 'WORKFLOW', note: 'Derived from previous_episode_id at push.' },
  'Episode.status': { reason: 'WORKFLOW', note: '17-state registry workflow; extractor never transitions status.' },
  'Episode.deferredFromStatus': { reason: 'WORKFLOW', note: 'Registry workflow.' },
  'Episode.referralDate': { reason: 'WORKFLOW', note: 'Referral metadata held in registry.' },
  'Episode.referralSource': { reason: 'WORKFLOW', note: 'As above.' },
  'Episode.referringClinicianOverride': { reason: 'WORKFLOW', note: 'As above.' },
  'Episode.statusChangedAt': { reason: 'WORKFLOW', note: 'Registry workflow.' },
  'Diagnosis.calculatedTStage': { reason: 'FORMULA_NOT_ADOPTED', note: 'No TNM calculator exists; documented TNM goes to confirmed* after verification.' },
  'Diagnosis.calculatedNStage': { reason: 'FORMULA_NOT_ADOPTED', note: 'As above.' },
  'Diagnosis.calculatedMStage': { reason: 'FORMULA_NOT_ADOPTED', note: 'As above.' },
  'Diagnosis.calculatedMeldNaScore': { reason: 'FORMULA_NOT_ADOPTED', note: 'Registry MELD-Na double-adjusts sodium (ADR-0001 defect 1). Extractor will not populate it.' },
  'Diagnosis.bclcOverrideReason': { reason: 'CLINICIAN_DECISION', note: 'Clinician entry.' },
  'Diagnosis.tnmOverrideReason': { reason: 'CLINICIAN_DECISION', note: 'Clinician entry.' },
  'Diagnosis.cpOverrideReason': { reason: 'CLINICIAN_DECISION', note: 'Clinician entry.' },
  'Diagnosis.meldOverrideReason': { reason: 'CLINICIAN_DECISION', note: 'Clinician entry.' },
  'Diagnosis.albiOverrideReason': { reason: 'CLINICIAN_DECISION', note: 'Clinician entry.' },
  'Diagnosis.calculationVersion': { reason: 'REGISTRY_DERIVED', note: 'Set from calculation_run.calculation_version at push.' },
  'MdtSession.location': { reason: 'WORKFLOW', note: 'MDT meeting metadata.' },
  'MdtSession.chair': { reason: 'WORKFLOW', note: 'MDT meeting metadata.' },
  'MdtRecord.decisionConditions': { reason: 'CLINICIAN_DECISION', note: 'Registry MDT entry.' },
  'MdtRecord.patientFitForProcedure': { reason: 'CLINICIAN_DECISION', note: 'Registry MDT checklist.' },
  'MdtRecord.performanceStatusAcceptable': { reason: 'CLINICIAN_DECISION', note: 'Registry MDT checklist.' },
  'MdtRecord.liverFunctionAcceptable': { reason: 'CLINICIAN_DECISION', note: 'Registry MDT checklist.' },
  'MdtRecord.tumourLoadAcceptable': { reason: 'CLINICIAN_DECISION', note: 'Registry MDT checklist.' },
  'MdtRecord.lockStatus': { reason: 'WORKFLOW', note: 'Registry lock workflow.' },
  'MdtRecord.submittedAt': { reason: 'WORKFLOW', note: 'Registry lock workflow.' },
  'MdtRecord.lockedAt': { reason: 'WORKFLOW', note: 'Registry lock workflow.' },
  'ClinicalScore.context': { reason: 'REGISTRY_DERIVED', note: 'Set to "EXTRACTOR_BASELINE" etc. at push.' },
  'ClinicalScore.meldNaScore': { reason: 'FORMULA_NOT_ADOPTED', note: 'See Diagnosis.calculatedMeldNaScore.' },
  'ClinicalScore.meldNaScoreRounded': { reason: 'FORMULA_NOT_ADOPTED', note: 'As above.' },
  'ClinicalScore.calculationVersion': { reason: 'REGISTRY_DERIVED', note: 'From calculation_run.' },
  'LabPanel.submittedAt': { reason: 'WORKFLOW', note: 'Registry workflow.' },
  'LabPanel.dialysisSessionsPastWeek': { reason: 'CLINICIAN_DECISION', note: 'Not reliably documented in reports; registry entry.' },
  'ClinicalSnapshot.snapshotDate': { reason: 'REGISTRY_DERIVED', note: 'Snapshots are frozen by the registry at MDT time.' },
  'ClinicalSnapshot.snapshotContext': { reason: 'REGISTRY_DERIVED', note: 'As above.' },
  'ClinicalSnapshot.meldNaScore': { reason: 'FORMULA_NOT_ADOPTED', note: 'See Diagnosis.calculatedMeldNaScore.' },
  'ClinicalSnapshot.meldNaScoreRounded': { reason: 'FORMULA_NOT_ADOPTED', note: 'As above.' },
  'ClinicalSnapshot.tumourStatusSummary': { reason: 'CLINICIAN_DECISION', note: 'Registry free text.' },
  'ClinicalSnapshot.calculationVersion': { reason: 'REGISTRY_DERIVED', note: 'From calculation_run.' },
  'Lesion.calculatedVolumeCm3': { reason: 'FORMULA_NOT_ADOPTED', note: 'No volume formula in the engine; ellipsoid approximation not adopted without clinical sign-off.' },
  'Lesion.notes': { reason: 'CLINICIAN_DECISION', note: 'Registry free text.' },
  'LesionDoseInjection.particleCount': { reason: 'CLINICIAN_DECISION', note: 'Rarely documented; registry entry.' },
  'LesionDoseInjection.notes': { reason: 'CLINICIAN_DECISION', note: 'Registry free text.' },
  'MappingSession.status': { reason: 'WORKFLOW', note: 'Registry workflow.' },
  'MappingSession.operatorUserId': { reason: 'WORKFLOW', note: 'Registry user reference; operator names are not extracted.' },
  'MappingSession.lockStatus': { reason: 'WORKFLOW', note: 'Registry lock workflow.' },
  'MaaStudy.balanceCheckPass': { reason: 'CLINICIAN_DECISION', note: 'Registry checklist item.' },
  'MaaStudy.calculationVersion': { reason: 'REGISTRY_DERIVED', note: 'From calculation_run.' },
  'DosimetryPlan.calculatedPrescribedActivityGbq': { reason: 'FORMULA_NOT_ADOPTED', note: 'Prescribed-activity models (BSA/MIRD/partition) are not recalculated by the extractor; documented prescribed activity only.' },
  'DosimetryPlan.prescribedActivityOverrideReason': { reason: 'CLINICIAN_DECISION', note: 'Clinician entry.' },
  'DosimetryPlan.particleDensityCalc': { reason: 'FORMULA_NOT_ADOPTED', note: 'Not calculated.' },
  'DosimetryPlan.lockStatus': { reason: 'WORKFLOW', note: 'Registry approval workflow.' },
  'DosimetryPlan.approvedAt': { reason: 'WORKFLOW', note: 'Approval is a registry action; never set by the extractor.' },
  'TreatmentSession.status': { reason: 'WORKFLOW', note: 'Registry workflow.' },
  'TreatmentSession.maaBalanceCheckedAtDelivery': { reason: 'CLINICIAN_DECISION', note: 'Registry checklist item.' },
  'TreatmentSession.operatorUserId': { reason: 'WORKFLOW', note: 'Registry user reference.' },
  'TreatmentSession.lockStatus': { reason: 'WORKFLOW', note: 'Registry lock workflow.' },
  'FollowUp.visitType': { reason: 'CLINICIAN_DECISION', note: 'Registry classification.' },
  'FollowUp.lockStatus': { reason: 'WORKFLOW', note: 'Registry lock workflow.' },
  'ToxicityEvent.notes': { reason: 'CLINICIAN_DECISION', note: 'Registry free text.' },
  'ToxicityEvent.lockStatus': { reason: 'WORKFLOW', note: 'Registry lock workflow.' },
  'EpisodeOutcome.calculatedOsMonths': { reason: 'FORMULA_NOT_ADOPTED', note: 'OS/PFS formula not yet consolidated (ADR-0001 defect 7). Phase 7 candidate after sign-off.' },
  'EpisodeOutcome.calculatedPfsMonths': { reason: 'FORMULA_NOT_ADOPTED', note: 'As above.' },
  'EpisodeOutcome.osPfsFormulaVersion': { reason: 'FORMULA_NOT_ADOPTED', note: 'As above.' },
  'EpisodeOutcome.confirmedOutcomeNotes': { reason: 'CLINICIAN_DECISION', note: 'Clinician entry.' },
  'EpisodeOutcome.calculationVersion': { reason: 'REGISTRY_DERIVED', note: 'From calculation_run.' },
};

export function registryOnlyReason(model: string, field: string): { reason: RegistryOnlyReason; note: string } | undefined {
  const explicit = REGISTRY_ONLY[`${model}.${field}`];
  if (explicit) return explicit;
  if (SYSTEM_FIELDS.has(field)) return { reason: 'SYSTEM', note: 'Registry-managed system column.' };
  if (field.endsWith('Id')) return { reason: 'FOREIGN_KEY', note: 'Relationship key — set by the push adapter from extractor entity links.' };
  return undefined;
}
