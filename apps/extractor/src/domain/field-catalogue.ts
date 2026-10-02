import type { DocumentClass, EntityType } from './vocab';

/**
 * Every clinical field the extractor knows about, with where it may come
 * from, how it is obtained, whether it is required for completeness, and
 * which existing registry column(s) it feeds. This is the single source for
 * docs/extractor/field_mapping.md (scripts/generate-field-mapping.ts) and for
 * the completeness engine — do not duplicate this information elsewhere.
 *
 * `registryTargets: []` means the registry currently has NO home for the
 * field (a documented gap — see field_mapping.md), not that it is unused.
 */

export type ValueType = 'number' | 'text' | 'date' | 'boolean' | 'code';

/**
 * EXTRACT     deterministic rule over source text
 * CALCULATE   calculation module only (never an LLM)
 * STRUCTURAL  held as a column of an entity row (identity/relationship), not a field_value
 * MANUAL      clinician entry in the review UI; not extracted
 */
export type ObtainMethod = 'EXTRACT' | 'CALCULATE' | 'STRUCTURAL' | 'MANUAL';

/**
 * ALWAYS          every value needs clinician verification before registry push
 * LOW_CONFIDENCE  verify when confidence < threshold, OCR-derived, or in conflict
 * ON_CONFLICT     verify only when sources disagree (low-risk metadata)
 */
export type VerificationRule = 'ALWAYS' | 'LOW_CONFIDENCE' | 'ON_CONFLICT';

export interface FieldDef {
  entity: EntityType;
  key: string;
  label: string;
  valueType: ValueType;
  unit?: string;
  sources: readonly DocumentClass[];
  method: ObtainMethod;
  formulaId?: string;
  /** Required for the data completeness engine. */
  required: boolean;
  verification: VerificationRule;
  registryTargets: readonly string[];
  note?: string;
}

const IMAGING_BASELINE: DocumentClass[] = ['BASELINE_CT', 'BASELINE_MRI', 'MDT'];
const FOLLOW_UP_IMAGING: DocumentClass[] = ['FOLLOWUP_CT', 'FOLLOWUP_MRI'];
const POST_Y90: DocumentClass[] = ['POST_Y90_PET_CT', 'POST_Y90_SPECT_CT'];

type Partial_ = Omit<FieldDef, 'entity'>;
function group(entity: EntityType, defs: Partial_[]): FieldDef[] {
  return defs.map((d) => ({ entity, ...d }));
}
const ex = (key: string, label: string, valueType: ValueType, sources: DocumentClass[], registryTargets: string[], extra: Partial<Partial_> = {}): Partial_ => ({
  key, label, valueType, sources, method: 'EXTRACT', required: false, verification: 'LOW_CONFIDENCE', registryTargets, ...extra,
});
const calc = (key: string, label: string, valueType: ValueType, formulaId: string, registryTargets: string[], extra: Partial<Partial_> = {}): Partial_ => ({
  key, label, valueType, sources: [], method: 'CALCULATE', formulaId, required: false, verification: 'ALWAYS', registryTargets, ...extra,
});

export const FIELD_CATALOGUE: readonly FieldDef[] = [
  ...group('patient', [
    ex('sex', 'Sex (as documented)', 'code', ['MDT', 'OTHER'], ['Patient.sex'], { required: true, verification: 'ALWAYS', note: 'Needed for MELD 3.0. Unknown sex is NOT defaulted to male (registry legacy behaviour is not reused).' }),
    ex('date_of_death', 'Date of death', 'date', ['OTHER'], ['Patient.dateOfDeath'], { verification: 'ALWAYS' }),
    ex('vital_status', 'Vital status', 'code', ['OTHER', 'MDT'], ['Patient.vitalStatus'], { verification: 'ALWAYS' }),
    ex('height_cm', 'Height', 'number', ['OTHER', 'DOSIMETRY_PLAN'], [], { unit: 'cm', note: 'Registry takes height only transiently for BSA.' }),
    ex('weight_kg', 'Weight', 'number', ['OTHER', 'DOSIMETRY_PLAN'], ['ClinicalScore.weightKg', 'ClinicalSnapshot.weightKg'], { unit: 'kg' }),
  ]),

  ...group('baseline_assessment', [
    { key: 'assessment_date', label: 'Baseline assessment date', valueType: 'date', sources: IMAGING_BASELINE, method: 'STRUCTURAL', required: true, verification: 'ON_CONFLICT', registryTargets: ['ClinicalScore.scoreDate'] },
    ex('diagnosis', 'Diagnosis / tumour type', 'code', ['MDT', 'PATHOLOGY', 'BASELINE_CT', 'BASELINE_MRI'], ['Diagnosis.tumourType'], { required: true, verification: 'ALWAYS', note: 'Normalised to registry DIAGNOSIS_TUMOUR_TYPE vocabulary.' }),
    ex('diagnosis_date', 'Date of diagnosis', 'date', ['MDT', 'PATHOLOGY'], ['Diagnosis.diagnosisDate'], { verification: 'ALWAYS' }),
    ex('primary_tumour', 'Primary tumour site', 'text', ['MDT', 'PATHOLOGY'], [], { note: 'Metastatic disease: primary site. Registry folds into tumourType only.' }),
    ex('aetiology', 'Underlying liver disease aetiology', 'code', ['MDT', 'BASELINE_CT', 'BASELINE_MRI'], ['Diagnosis.aetiology']),
    ex('histology', 'Histology', 'text', ['PATHOLOGY', 'MDT'], [], { verification: 'ALWAYS' }),
    ex('histology_confirmed', 'Histological confirmation', 'boolean', ['PATHOLOGY', 'MDT'], ['Diagnosis.histologyConfirmed'], { verification: 'ALWAYS' }),
    ex('grade', 'Tumour grade', 'text', ['PATHOLOGY'], []),
    ex('ki67_percent', 'Ki-67 index', 'number', ['PATHOLOGY'], [], { unit: '%' }),
    ex('ecog', 'ECOG performance status', 'number', ['MDT', 'OTHER'], ['ClinicalScore.ecogScore', 'ClinicalSnapshot.ecogScore'], { required: true, verification: 'ALWAYS' }),
    ex('cirrhosis', 'Cirrhosis', 'boolean', ['BASELINE_CT', 'BASELINE_MRI', 'MDT'], []),
    ex('ascites', 'Ascites (none / mild / moderate-severe)', 'code', ['BASELINE_CT', 'BASELINE_MRI', 'MDT'], ['ClinicalScore.ascites'], { note: 'Child-Pugh input. Radiological ascites ≠ clinical grade — verification required for CP use.' }),
    ex('encephalopathy', 'Hepatic encephalopathy grade', 'code', ['MDT', 'OTHER'], ['ClinicalScore.encephalopathy'], { note: 'Child-Pugh input; rarely in imaging reports — expect NOT_DOCUMENTED.' }),
    ex('portal_hypertension', 'Portal hypertension', 'boolean', ['BASELINE_CT', 'BASELINE_MRI', 'MDT'], []),
    ex('pvtt', 'Portal vein tumour thrombus (extent)', 'code', ['BASELINE_CT', 'BASELINE_MRI', 'MDT'], [], { note: 'Registry accepts PVTT only transiently as a BCLC input.' }),
    ex('vascular_invasion', 'Macrovascular invasion', 'boolean', ['BASELINE_CT', 'BASELINE_MRI', 'MDT'], []),
    ex('biliary_obstruction', 'Biliary obstruction', 'boolean', ['BASELINE_CT', 'BASELINE_MRI', 'MDT'], []),
    ex('extrahepatic_disease', 'Extrahepatic disease', 'boolean', ['BASELINE_CT', 'BASELINE_MRI', 'MDT'], [], { note: 'Transient BCLC input in registry.' }),
    ex('tumour_count', 'Number of liver tumours', 'number', IMAGING_BASELINE, [], { note: 'Should equal count of tumour_lesion rows; mismatch raises a conflict.' }),
    ex('previous_chemotherapy', 'Previous systemic chemotherapy', 'text', ['MDT'], ['MdtRecord.priorTreatmentSummary']),
    ex('previous_immunotherapy', 'Previous immunotherapy', 'text', ['MDT'], ['MdtRecord.priorTreatmentSummary']),
    ex('previous_liver_directed_treatment', 'Previous liver-directed treatment', 'text', ['MDT', 'BASELINE_CT', 'BASELINE_MRI'], ['MdtRecord.priorTreatmentSummary']),
    ex('tnm_t', 'TNM T (as documented)', 'code', ['MDT', 'PATHOLOGY'], ['Diagnosis.confirmedTStage'], { verification: 'ALWAYS', note: 'No TNM calculator exists; registry calculatedTStage stays empty.' }),
    ex('tnm_n', 'TNM N (as documented)', 'code', ['MDT', 'PATHOLOGY'], ['Diagnosis.confirmedNStage'], { verification: 'ALWAYS' }),
    ex('tnm_m', 'TNM M (as documented)', 'code', ['MDT', 'PATHOLOGY'], ['Diagnosis.confirmedMStage'], { verification: 'ALWAYS' }),
    ex('bclc_documented', 'BCLC stage (as documented)', 'code', ['MDT'], ['Diagnosis.confirmedBclcStage'], { verification: 'ALWAYS' }),
    ex('child_pugh_documented', 'Child-Pugh class (as documented)', 'code', ['MDT'], ['Diagnosis.confirmedCpGrade'], { verification: 'ALWAYS' }),
    ex('sarcopenia', 'Sarcopenia (as documented)', 'text', IMAGING_BASELINE, [], { note: 'Not present in current registry; captured only if documented. No SMI calculation (needs L3 segmentation).' }),
    calc('child_pugh', 'Child-Pugh score/class (calculated)', 'code', 'CHILD_PUGH_STRICT', ['Diagnosis.calculatedCpScore', 'Diagnosis.calculatedCpGrade', 'ClinicalScore.cpGrade', 'ClinicalScore.cpTotalScore', 'ClinicalSnapshot.cpGrade', 'ClinicalSnapshot.cpTotalScore'], { note: 'All 5 components required (registry legacy 2-of-5 behaviour is NOT used).' }),
    calc('albi', 'ALBI score/grade', 'number', 'ALBI', ['Diagnosis.calculatedAlbiScore', 'Diagnosis.calculatedAlbiGrade', 'ClinicalScore.albiScore', 'ClinicalScore.albiGrade', 'ClinicalSnapshot.albiScore', 'ClinicalSnapshot.albiGrade']),
    calc('meld3', 'MELD 3.0', 'number', 'MELD_3_0_STRICT', ['Diagnosis.calculatedMeld3Score', 'ClinicalScore.meld3Score', 'ClinicalSnapshot.meld3Score'], { note: 'Requires documented sex; dialysis status must be documented or explicitly NOT_DOCUMENTED.' }),
    calc('bclc_calculated', 'BCLC 2022 (calculated)', 'code', 'BCLC_2022', ['Diagnosis.calculatedBclcStage', 'ClinicalScore.bclcStage', 'ClinicalSnapshot.bclcStage'], { note: 'Only from clinician-verified inputs. Legacy cascade (stage 0 unreachable) — flagged in ADR-0001.' }),
    calc('bsa', 'Body surface area (Mosteller)', 'number', 'BSA_MOSTELLER', ['ClinicalScore.bsaM2', 'ClinicalSnapshot.bsaM2'], { unit: 'm2' }),
  ]),

  ...group('laboratory_episode', [
    { key: 'collected_date', label: 'Sample date', valueType: 'date', sources: ['LABS'], method: 'STRUCTURAL', required: true, verification: 'ON_CONFLICT', registryTargets: ['LabPanel.collectedAt'] },
    ex('bilirubin', 'Bilirubin', 'number', ['LABS', 'MDT'], ['LabPanel.bilirubinTotalUmolL'], { unit: 'umol/L', required: true }),
    ex('albumin', 'Albumin', 'number', ['LABS', 'MDT'], ['LabPanel.albuminGL'], { unit: 'g/L', required: true }),
    ex('inr', 'INR', 'number', ['LABS', 'MDT'], ['LabPanel.inr'], { required: true }),
    ex('creatinine', 'Creatinine', 'number', ['LABS'], ['LabPanel.creatinineUmolL'], { unit: 'umol/L' }),
    ex('egfr', 'eGFR', 'number', ['LABS'], [], { unit: 'mL/min/1.73m2' }),
    ex('sodium', 'Sodium', 'number', ['LABS'], ['LabPanel.sodiumMmolL'], { unit: 'mmol/L' }),
    ex('alt', 'ALT', 'number', ['LABS'], [], { unit: 'U/L' }),
    ex('ast', 'AST', 'number', ['LABS'], [], { unit: 'U/L' }),
    ex('alp', 'ALP', 'number', ['LABS'], [], { unit: 'U/L' }),
    ex('platelets', 'Platelets', 'number', ['LABS'], ['LabPanel.plateletsE9L'], { unit: '10^9/L' }),
    ex('neutrophils', 'Neutrophils', 'number', ['LABS'], [], { unit: '10^9/L' }),
    ex('afp', 'AFP', 'number', ['LABS', 'MDT'], ['LabPanel.afpNgMl'], { unit: 'as reported', verification: 'ALWAYS', note: 'UK labs often report kU/L; registry column is ng/mL. Conversion factor is assay-dependent — never auto-converted.' }),
    ex('cea', 'CEA', 'number', ['LABS'], [], { unit: 'ug/L' }),
    ex('ca19_9', 'CA19-9', 'number', ['LABS'], [], { unit: 'kU/L' }),
    ex('on_dialysis', 'On dialysis', 'boolean', ['LABS', 'MDT', 'OTHER'], ['LabPanel.onDialysis']),
  ]),

  ...group('tumour_lesion', [
    { key: 'lesion_label', label: 'Lesion identifier', valueType: 'text', sources: IMAGING_BASELINE, method: 'STRUCTURAL', required: true, verification: 'ALWAYS', registryTargets: ['Lesion.lesionNumber'] },
    ex('segment', 'Couinaud segment(s)', 'text', IMAGING_BASELINE, ['Lesion.segment'], { verification: 'ALWAYS' }),
    ex('laterality', 'Lobe', 'code', IMAGING_BASELINE, ['Lesion.laterality']),
    ex('baseline_longest_diameter_mm', 'Baseline longest axial diameter', 'number', IMAGING_BASELINE, ['Lesion.diameterAxialMm'], { unit: 'mm', verification: 'ALWAYS' }),
    ex('baseline_viable_diameter_mm', 'Baseline longest viable (enhancing) diameter', 'number', IMAGING_BASELINE, [], { unit: 'mm', note: 'mRECIST input.' }),
    ex('baseline_cc_diameter_mm', 'Baseline craniocaudal diameter', 'number', IMAGING_BASELINE, ['Lesion.diameterCraniocaudalMm'], { unit: 'mm' }),
    ex('baseline_ap_diameter_mm', 'Baseline AP diameter', 'number', IMAGING_BASELINE, ['Lesion.diameterApMm'], { unit: 'mm' }),
    ex('target_status', 'Target / non-target', 'code', IMAGING_BASELINE, ['Lesion.isTargetLesion'], { verification: 'ALWAYS', note: 'Target selection is a clinician decision; extraction proposes only.' }),
    ex('enhancement', 'Baseline enhancement pattern', 'text', IMAGING_BASELINE, []),
    ex('lirads', 'LI-RADS category', 'code', ['BASELINE_CT', 'BASELINE_MRI'], ['Lesion.lirads']),
    ex('vascular_invasion_relationship', 'Relationship to vascular invasion', 'text', IMAGING_BASELINE, []),
    ex('previous_treatment', 'Previous treatment of this lesion', 'text', IMAGING_BASELINE, []),
    { key: 'treatment_territory', label: 'Treatment territory', valueType: 'text', sources: ['MAPPING_ANGIOGRAPHY', 'DOSIMETRY_PLAN'], method: 'STRUCTURAL', required: false, verification: 'ALWAYS', registryTargets: [] },
  ]),

  ...group('mapping_procedure', [
    { key: 'mapping_date', label: 'Mapping date', valueType: 'date', sources: ['MAPPING_ANGIOGRAPHY'], method: 'STRUCTURAL', required: true, verification: 'ON_CONFLICT', registryTargets: ['MappingSession.sessionDate'] },
    ex('access', 'Access route', 'code', ['MAPPING_ANGIOGRAPHY'], ['MappingSession.accessRoute']),
    ex('access_site', 'Access site / side', 'text', ['MAPPING_ANGIOGRAPHY'], ['MappingSession.accessSite']),
    ex('sheath', 'Sheath', 'text', ['MAPPING_ANGIOGRAPHY'], []),
    ex('catheter', 'Catheter', 'text', ['MAPPING_ANGIOGRAPHY'], ['MappingSession.catheterType']),
    ex('microcatheter', 'Microcatheter', 'text', ['MAPPING_ANGIOGRAPHY'], []),
    ex('arterial_anatomy', 'Hepatic arterial anatomy (Michels)', 'code', ['MAPPING_ANGIOGRAPHY'], ['MappingSession.michelsAnatomy'], { verification: 'ALWAYS' }),
    ex('variant_anatomy', 'Variant anatomy (free text)', 'text', ['MAPPING_ANGIOGRAPHY'], []),
    ex('cbct_performed', 'Cone-beam CT performed', 'boolean', ['MAPPING_ANGIOGRAPHY'], []),
    ex('cbct_perfused_volume_ml', 'CBCT perfused volume', 'number', ['MAPPING_ANGIOGRAPHY'], [], { unit: 'mL' }),
    ex('cbct_tumour_volume_ml', 'CBCT tumour volume', 'number', ['MAPPING_ANGIOGRAPHY'], [], { unit: 'mL' }),
    ex('cbct_at_ratio_documented', 'CBCT A/T ratio (as documented)', 'number', ['MAPPING_ANGIOGRAPHY'], []),
    ex('prophylactic_embolisation', 'Prophylactic embolisation', 'boolean', ['MAPPING_ANGIOGRAPHY'], []),
    ex('embolic_material', 'Embolic material', 'code', ['MAPPING_ANGIOGRAPHY'], ['MappingSession.embolicMaterial']),
    ex('maa_activity_mbq', 'MAA activity administered', 'number', ['MAPPING_ANGIOGRAPHY', 'MAA_ADMINISTRATION'], ['MaaStudy.injectedActivityMbq'], { unit: 'MBq' }),
    ex('fluoroscopy_time_min', 'Fluoroscopy time', 'number', ['MAPPING_ANGIOGRAPHY'], ['MappingSession.fluoroTimeMin'], { unit: 'min' }),
    ex('dap_gycm2', 'Dose-area product', 'number', ['MAPPING_ANGIOGRAPHY'], ['MappingSession.dapGyCm2'], { unit: 'Gy.cm2', verification: 'ALWAYS', note: 'Units vary (Gy.cm2, mGy.m2, uGy.m2); unit captured as documented and never silently converted.' }),
    ex('contrast_volume_ml', 'Contrast volume', 'number', ['MAPPING_ANGIOGRAPHY'], ['MappingSession.contrastVolumeMl'], { unit: 'mL' }),
    ex('mapping_complication', 'Mapping complication', 'text', ['MAPPING_ANGIOGRAPHY'], ['MappingSession.complications']),
    ex('mapping_technical_success', 'Mapping technical success', 'boolean', ['MAPPING_ANGIOGRAPHY'], []),
    ex('same_day_sirt', 'Same-day mapping and SIRT', 'boolean', ['MAPPING_ANGIOGRAPHY', 'Y90_TREATMENT'], []),
    calc('cbct_at_ratio', 'CBCT angiosome-to-tumour (A/T) ratio (calculated)', 'number', 'CBCT_AT_RATIO', [], { note: 'CBCT perfused volume ÷ CBCT tumour volume (dimensionless), per the V116 registry definition (M5.4). Both inputs must come from the same mapping CBCT.' }),
  ]),

  ...group('procedure_vessel', [
    { key: 'vessel_name', label: 'Vessel (target / feeder / embolised / MAA / Y-90 position)', valueType: 'text', sources: ['MAPPING_ANGIOGRAPHY', 'Y90_TREATMENT'], method: 'STRUCTURAL', required: false, verification: 'ALWAYS', registryTargets: ['LesionFeeder.vesselName', 'LesionFeeder.feederNumber'], note: 'Only TUMOUR_FEEDER vessels linked to a lesion map to LesionFeeder; TARGET/EMBOLISED/MAA_INJECTION roles have no registry home.' },
  ]),

  ...group('maa_study', [
    { key: 'study_date', label: 'MAA SPECT/CT date', valueType: 'date', sources: ['MAA_SPECT_CT'], method: 'STRUCTURAL', required: true, verification: 'ON_CONFLICT', registryTargets: ['MaaStudy.studyDate', 'ImagingStudy.studyDate'] },
    ex('maa_activity_mbq', 'MAA activity (per SPECT report)', 'number', ['MAA_SPECT_CT'], ['MaaStudy.injectedActivityMbq'], { unit: 'MBq' }),
    ex('injection_position', 'MAA injection position', 'text', ['MAA_SPECT_CT', 'MAPPING_ANGIOGRAPHY'], []),
    ex('lung_shunt_fraction_percent', 'Lung shunt fraction', 'number', ['MAA_SPECT_CT', 'DOSIMETRY_PLAN'], ['MaaStudy.lungShuntFraction'], { unit: '%', required: true, verification: 'ALWAYS', note: 'Stored as PERCENT. Registry column is unit-less — push writes percent, matching calculateLungShuntRiskBand.' }),
    ex('lung_dose_gy', 'Predicted lung dose (MAA report)', 'number', ['MAA_SPECT_CT'], [], { unit: 'Gy' }),
    ex('extrahepatic_uptake', 'Extrahepatic uptake', 'boolean', ['MAA_SPECT_CT'], ['MaaStudy.extrahepaticUptake'], { verification: 'ALWAYS' }),
    ex('extrahepatic_uptake_sites', 'Extrahepatic uptake sites', 'text', ['MAA_SPECT_CT'], ['MaaStudy.extrahepaticUptakeSites']),
    ex('tumour_uptake', 'Tumour uptake description', 'text', ['MAA_SPECT_CT'], []),
    ex('normal_liver_uptake', 'Normal liver uptake description', 'text', ['MAA_SPECT_CT'], []),
    ex('distribution_matches_target', 'MAA distribution concordant with target', 'boolean', ['MAA_SPECT_CT'], ['MaaStudy.maaDistributionMatchesTarget']),
    ex('perfused_volume_ml', 'Perfused volume', 'number', ['MAA_SPECT_CT', 'DOSIMETRY_PLAN'], [], { unit: 'mL' }),
    ex('tumour_volume_ml', 'Tumour volume', 'number', ['MAA_SPECT_CT', 'DOSIMETRY_PLAN'], [], { unit: 'mL' }),
    ex('tumour_normal_ratio_documented', 'MAA tumour-to-normal uptake ratio (T/N, as documented)', 'number', ['MAA_SPECT_CT', 'DOSIMETRY_PLAN'], [], { note: 'Count-density ratio. Distinct from the A/T volume ratio and from DosimetryPlan.tumourLiverVolumeRatio. Never defaulted to 1 when absent.' }),
    ex('maa_at_ratio_documented', 'MAA angiosome-to-tumour (A/T) ratio (as documented)', 'number', ['MAA_SPECT_CT', 'DOSIMETRY_PLAN'], []),
    ex('predicted_tumour_dose_gy', 'Predicted tumour dose (MAA report)', 'number', ['MAA_SPECT_CT'], [], { unit: 'Gy' }),
    ex('predicted_normal_liver_dose_gy', 'Predicted normal-liver dose (MAA report)', 'number', ['MAA_SPECT_CT'], [], { unit: 'Gy' }),
    ex('dosimetry_method', 'Dosimetry method (MAA report)', 'text', ['MAA_SPECT_CT'], []),
    calc('lsf_risk_band', 'LSF risk band', 'code', 'LUNG_SHUNT_RISK_BAND', ['MaaStudy.calculatedLsfRiskBand']),
    calc('maa_at_ratio', 'MAA angiosome-to-tumour (A/T) ratio (calculated)', 'number', 'MAA_AT_RATIO', [], { note: 'MAA/SPECT perfused volume ÷ MAA tumour volume. No fallback to the mapping tumour volume (V116 does fall back — see V116 audit F3).' }),
  ]),

  ...group('dosimetry_plan', [
    { key: 'plan_date', label: 'Plan date', valueType: 'date', sources: ['DOSIMETRY_PLAN'], method: 'STRUCTURAL', required: true, verification: 'ON_CONFLICT', registryTargets: ['DosimetryPlan.planDate'] },
    ex('method', 'Dosimetry method / planning model', 'code', ['DOSIMETRY_PLAN'], ['DosimetryPlan.planningModel'], { required: true }),
    ex('product', 'Y-90 product', 'code', ['DOSIMETRY_PLAN'], ['DosimetryPlan.particleProduct']),
    ex('target_volume_ml', 'Target (perfused) volume', 'number', ['DOSIMETRY_PLAN'], ['DosimetryPlan.targetLiverVolumeCm3'], { unit: 'mL' }),
    ex('treated_liver_volume_percent', 'Treated liver volume %', 'number', ['DOSIMETRY_PLAN'], ['DosimetryPlan.treatedLiverVolumePercent'], { unit: '%' }),
    ex('tumour_volume_ml', 'Tumour volume', 'number', ['DOSIMETRY_PLAN'], [], { unit: 'mL' }),
    ex('normal_liver_volume_ml', 'Normal liver volume', 'number', ['DOSIMETRY_PLAN'], [], { unit: 'mL' }),
    ex('tumour_liver_volume_ratio', 'Tumour/liver volume ratio (as documented)', 'number', ['DOSIMETRY_PLAN'], ['DosimetryPlan.tumourLiverVolumeRatio'], { note: 'Definition in registry is UNKNOWN (tumour/whole-liver vs tumour/perfused) — documented value only, never calculated.' }),
    ex('prescribed_activity_gbq', 'Prescribed activity', 'number', ['DOSIMETRY_PLAN'], ['DosimetryPlan.confirmedPrescribedActivityGbq'], { unit: 'GBq', required: true, verification: 'ALWAYS' }),
    ex('predicted_tumour_dose_gy', 'Predicted tumour dose', 'number', ['DOSIMETRY_PLAN'], [], { unit: 'Gy' }),
    ex('predicted_normal_liver_dose_gy', 'Predicted normal-liver dose', 'number', ['DOSIMETRY_PLAN'], [], { unit: 'Gy' }),
    ex('predicted_lung_dose_gy', 'Predicted lung dose', 'number', ['DOSIMETRY_PLAN'], [], { unit: 'Gy' }),
  ]),

  ...group('y90_treatment', [
    { key: 'treatment_date', label: 'Y-90 treatment date', valueType: 'date', sources: ['Y90_TREATMENT'], method: 'STRUCTURAL', required: true, verification: 'ON_CONFLICT', registryTargets: ['TreatmentSession.sessionDate'] },
    { key: 'sequence_number', label: 'Treatment sequence number', valueType: 'number', sources: ['Y90_TREATMENT'], method: 'STRUCTURAL', required: true, verification: 'ON_CONFLICT', registryTargets: ['TreatmentSession.sessionNumber'] },
    ex('y90_product', 'Y-90 product', 'code', ['Y90_TREATMENT', 'DOSIMETRY_PLAN'], ['TreatmentSession.particleProduct']),
    ex('glass_or_resin', 'Glass or resin', 'code', ['Y90_TREATMENT', 'DOSIMETRY_PLAN'], [], { note: 'Deterministic from product name when product is documented; still verified.' }),
    ex('treatment_intent', 'Treatment intent', 'code', ['Y90_TREATMENT', 'MDT', 'DOSIMETRY_PLAN'], [], { verification: 'ALWAYS' }),
    ex('access', 'Access route', 'code', ['Y90_TREATMENT'], ['TreatmentSession.accessRoute']),
    ex('access_site', 'Access site', 'text', ['Y90_TREATMENT'], ['TreatmentSession.accessSite']),
    ex('catheter', 'Catheter / microcatheter', 'text', ['Y90_TREATMENT'], ['TreatmentSession.catheterType']),
    ex('embolic_material', 'Embolic material', 'code', ['Y90_TREATMENT'], ['TreatmentSession.embolicMaterial']),
    ex('planned_activity_gbq', 'Planned activity (treatment report)', 'number', ['Y90_TREATMENT'], [], { unit: 'GBq' }),
    ex('delivered_activity_gbq', 'Delivered activity', 'number', ['Y90_TREATMENT'], ['TreatmentSession.administeredActivityGbq'], { unit: 'GBq', required: true, verification: 'ALWAYS', note: 'Never populated from planned/prescribed activity.' }),
    ex('residual_activity_gbq', 'Residual activity', 'number', ['Y90_TREATMENT'], [], { unit: 'GBq' }),
    ex('delivery_percentage_documented', 'Delivery % (as documented)', 'number', ['Y90_TREATMENT'], [], { unit: '%' }),
    ex('reflux', 'Reflux', 'boolean', ['Y90_TREATMENT'], []),
    ex('stasis', 'Stasis', 'boolean', ['Y90_TREATMENT'], []),
    ex('technical_issue', 'Technical issue', 'text', ['Y90_TREATMENT'], []),
    ex('technical_success', 'Technical success', 'boolean', ['Y90_TREATMENT'], []),
    ex('immediate_complication', 'Immediate complication', 'text', ['Y90_TREATMENT'], ['TreatmentSession.complications']),
    ex('same_day_discharge', 'Same-day discharge', 'boolean', ['Y90_TREATMENT', 'OTHER'], []),
    ex('staged_treatment', 'Staged treatment', 'boolean', ['Y90_TREATMENT', 'MDT'], []),
    ex('fluoroscopy_time_min', 'Fluoroscopy time', 'number', ['Y90_TREATMENT'], ['TreatmentSession.fluoroTimeMin'], { unit: 'min' }),
    ex('dap_gycm2', 'Dose-area product', 'number', ['Y90_TREATMENT'], ['TreatmentSession.dapGyCm2'], { unit: 'Gy.cm2', verification: 'ALWAYS' }),
    ex('contrast_volume_ml', 'Contrast volume', 'number', ['Y90_TREATMENT'], ['TreatmentSession.contrastVolumeMl'], { unit: 'mL' }),
    calc('number_of_administration_positions', 'Number of administration positions', 'number', 'COUNT_ADMINISTRATIONS', [], { verification: 'ON_CONFLICT' }),
    calc('delivery_percentage', 'Planned vs delivered activity %', 'number', 'DELIVERY_PERCENTAGE', [], { unit: '%' }),
  ]),

  ...group('y90_administration', [
    ex('vessel', 'Administration vessel', 'text', ['Y90_TREATMENT'], [], { verification: 'ALWAYS' }),
    ex('planned_activity_gbq', 'Planned activity (position)', 'number', ['Y90_TREATMENT', 'DOSIMETRY_PLAN'], [], { unit: 'GBq' }),
    ex('delivered_activity_gbq', 'Delivered activity (position)', 'number', ['Y90_TREATMENT'], ['LesionDoseInjection.deliveredActivityGbq'], { unit: 'GBq', verification: 'ALWAYS', note: 'Maps to LesionDoseInjection only when the position is clinician-linked to a lesion (and optionally feeder).' }),
  ]),

  ...group('post_treatment_dosimetry', [
    { key: 'scan_date', label: 'Post-Y90 scan date', valueType: 'date', sources: POST_Y90, method: 'STRUCTURAL', required: true, verification: 'ON_CONFLICT', registryTargets: ['ImagingStudy.studyDate'] },
    { key: 'modality', label: 'Post-Y90 modality', valueType: 'code', sources: POST_Y90, method: 'STRUCTURAL', required: true, verification: 'ON_CONFLICT', registryTargets: ['ImagingStudy.modality'] },
    ex('distribution', 'Distribution description', 'text', POST_Y90, []),
    ex('intended_territory_concordance', 'Concordant with intended territory', 'boolean', POST_Y90, [], { verification: 'ALWAYS' }),
    ex('tumour_coverage', 'Tumour coverage', 'text', POST_Y90, []),
    ex('untreated_tumour', 'Untreated tumour identified', 'boolean', POST_Y90, [], { verification: 'ALWAYS' }),
    ex('non_target_activity', 'Non-target activity', 'text', POST_Y90, [], { verification: 'ALWAYS' }),
    ex('delivered_tumour_dose_gy', 'Delivered tumour dose', 'number', POST_Y90, ['LesionDoseInjection.deliveredDoseGy'], { unit: 'Gy', verification: 'ALWAYS', note: 'Lesion-level registry column: populated only when the dose is documented for a specific lesion.' }),
    ex('delivered_normal_liver_dose_gy', 'Delivered normal-liver dose', 'number', POST_Y90, [], { unit: 'Gy' }),
    ex('delivered_lung_dose_gy', 'Delivered lung dose', 'number', POST_Y90, [], { unit: 'Gy' }),
    ex('voxel_metrics', 'Voxel dosimetry metrics (D70, V100, etc.) as documented', 'text', POST_Y90, []),
  ]),

  ...group('follow_up_episode', [
    { key: 'imaging_date', label: 'Follow-up imaging date', valueType: 'date', sources: FOLLOW_UP_IMAGING, method: 'STRUCTURAL', required: true, verification: 'ON_CONFLICT', registryTargets: ['FollowUp.followUpDate', 'ImagingStudy.studyDate'] },
    { key: 'modality', label: 'Follow-up modality', valueType: 'code', sources: FOLLOW_UP_IMAGING, method: 'STRUCTURAL', required: true, verification: 'ON_CONFLICT', registryTargets: ['ImagingStudy.modality'] },
    calc('interval_window', 'Follow-up window (EARLY/M3/M6/M9/M12/LATE)', 'code', 'FOLLOW_UP_WINDOW', ['FollowUp.intendedTimepoint'], { verification: 'ON_CONFLICT' }),
    calc('interval_months', 'Interval from first Y-90 (months)', 'number', 'INTERVAL_MONTHS', ['FollowUp.intervalMonths'], { verification: 'ON_CONFLICT', note: 'Divisor 30.4375 days/month, documented in formula version (ADR-0001 notes three legacy divisors).' }),
    ex('treated_territory_status', 'Treated territory status', 'text', FOLLOW_UP_IMAGING, []),
    ex('out_of_field_intrahepatic_progression', 'Out-of-field intrahepatic progression', 'boolean', FOLLOW_UP_IMAGING, [], { verification: 'ALWAYS' }),
    ex('extrahepatic_progression', 'Extrahepatic progression', 'boolean', FOLLOW_UP_IMAGING, [], { verification: 'ALWAYS' }),
    ex('pvtt', 'PVTT at follow-up', 'code', FOLLOW_UP_IMAGING, []),
    ex('ascites', 'Ascites at follow-up', 'code', FOLLOW_UP_IMAGING, []),
    ex('biliary_complication', 'Biliary complication', 'text', FOLLOW_UP_IMAGING, []),
    ex('other_toxicity', 'Other toxicity', 'text', [...FOLLOW_UP_IMAGING, 'OTHER'], []),
    ex('overall_response_documented', 'Overall response (as documented by reporter)', 'text', FOLLOW_UP_IMAGING, ['FollowUp.overallResponse'], { verification: 'ALWAYS' }),
  ]),

  ...group('lesion_follow_up', [
    ex('longest_diameter_mm', 'Longest axial diameter', 'number', FOLLOW_UP_IMAGING, [], { unit: 'mm' }),
    ex('viable_diameter_mm', 'Longest viable diameter', 'number', FOLLOW_UP_IMAGING, [], { unit: 'mm' }),
    ex('enhancement', 'Enhancement', 'text', FOLLOW_UP_IMAGING, []),
    ex('necrosis', 'Necrosis', 'text', FOLLOW_UP_IMAGING, []),
    ex('treated_lesion_status', 'Treated lesion status', 'text', FOLLOW_UP_IMAGING, []),
    calc('percent_change_longest', '% change in longest diameter vs baseline', 'number', 'PERCENT_SIZE_CHANGE', [], { unit: '%' }),
    calc('response_recist', 'RECIST 1.1 lesion category', 'code', 'RECIST_1_1_LESION', ['FollowUp.overallResponse'], { note: 'Only when baseline and follow-up measurements of the same lesion exist; written to a lesion-scoped FollowUp row.' }),
    calc('response_mrecist', 'mRECIST lesion category', 'code', 'MRECIST_LESION', ['FollowUp.overallResponse'], { note: 'Only with viable-diameter measurements at both timepoints.' }),
  ]),

  ...group('complication', [
    ex('type', 'Complication type', 'text', ['Y90_TREATMENT', 'MAPPING_ANGIOGRAPHY', ...FOLLOW_UP_IMAGING, 'OTHER'], ['ToxicityEvent.toxicityType'], { verification: 'ALWAYS' }),
    ex('ctcae_grade', 'CTCAE grade (as documented)', 'number', ['OTHER'], ['ToxicityEvent.ctcaeGrade'], { verification: 'ALWAYS', note: 'Never inferred from narrative.' }),
    ex('reild_grade', 'REILD grade (as documented)', 'code', ['OTHER', 'MDT'], ['ToxicityEvent.reildGrade'], { verification: 'ALWAYS' }),
    ex('onset_date', 'Onset date', 'date', ['OTHER', ...FOLLOW_UP_IMAGING], ['ToxicityEvent.onsetDate']),
    ex('resolved_date', 'Resolution date', 'date', ['OTHER'], ['ToxicityEvent.resolvedDate']),
    ex('outcome', 'Complication outcome', 'text', ['OTHER'], ['ToxicityEvent.outcome']),
  ]),

  ...group('subsequent_treatment', [
    ex('treatment_type', 'Subsequent treatment type', 'text', ['MDT', 'OTHER'], []),
    ex('start_date', 'Subsequent treatment start date', 'date', ['MDT', 'OTHER'], []),
  ]),

  ...group('outcome', [
    ex('outcome_status', 'Outcome status', 'code', ['MDT', 'OTHER'], ['EpisodeOutcome.outcomeStatus'], { verification: 'ALWAYS' }),
    ex('progression_date', 'Progression date', 'date', [...FOLLOW_UP_IMAGING, 'MDT'], ['EpisodeOutcome.progressionDate'], { verification: 'ALWAYS' }),
    ex('progression_reason', 'Progression reason', 'code', [...FOLLOW_UP_IMAGING, 'MDT'], ['EpisodeOutcome.progressionReason'], { verification: 'ALWAYS' }),
    ex('last_known_alive_date', 'Last known alive date', 'date', ['OTHER', 'MDT'], []),
  ]),

  ...group('study', [
    { key: 'study_date', label: 'Study date', valueType: 'date', sources: [], method: 'STRUCTURAL', required: false, verification: 'ON_CONFLICT', registryTargets: ['ImagingStudy.studyDate'] },
    { key: 'modality', label: 'Modality', valueType: 'code', sources: [], method: 'STRUCTURAL', required: false, verification: 'ON_CONFLICT', registryTargets: ['ImagingStudy.modality'] },
    { key: 'body_part', label: 'Body part', valueType: 'text', sources: [], method: 'STRUCTURAL', required: false, verification: 'ON_CONFLICT', registryTargets: ['ImagingStudy.bodyPart'] },
    { key: 'phase', label: 'Pathway phase (from document class)', valueType: 'code', sources: [], method: 'STRUCTURAL', required: false, verification: 'ON_CONFLICT', registryTargets: ['ImagingStudy.phase'] },
  ]),

  ...group('sirt_episode', [
    ex('mdt_decision', 'MDT decision', 'code', ['MDT'], ['MdtRecord.decision'], { verification: 'ALWAYS' }),
    ex('mdt_decision_detail', 'MDT decision detail', 'text', ['MDT'], ['MdtRecord.decisionDetail']),
    ex('mdt_disease_summary', 'MDT disease summary', 'text', ['MDT'], ['MdtRecord.diseaseSummary']),
    { key: 'mdt_date', label: 'MDT meeting date', valueType: 'date', sources: ['MDT'], method: 'STRUCTURAL', required: false, verification: 'ON_CONFLICT', registryTargets: ['MdtSession.sessionDate'] },
  ]),
];

export function fieldDef(entity: string, key: string): FieldDef | undefined {
  return FIELD_CATALOGUE.find((f) => f.entity === entity && f.key === key);
}
