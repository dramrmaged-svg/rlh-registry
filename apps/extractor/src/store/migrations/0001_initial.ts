import {
  CAPTURE_METHODS,
  DOCUMENT_CLASSES,
  ENTITY_TYPES,
  EXTRACTION_METHODS,
  FOLLOW_UP_WINDOWS,
  LAB_CONTEXTS,
  VALUE_STATUSES,
  VERIFICATION_STATUSES,
  VESSEL_ROLES,
  sqlInList,
} from '../../domain/vocab';

/**
 * Schema v1. Entity tables hold structure only (identity, relationships,
 * ordering dates); clinical values live in `field_value` with provenance.
 * See docs/extractor/01_target_architecture.md §3–4.
 *
 * Never edit a released migration — add a new one. The migrator stores a
 * checksum and refuses to run if an applied migration's SQL has changed.
 */
const ts = `created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))`;

export const MIGRATION_0001 = `
CREATE TABLE patient (
  id TEXT PRIMARY KEY,
  local_key TEXT NOT NULL UNIQUE,
  registry_patient_id TEXT,
  ${ts}
);

-- Identifiers are isolated so exports / AI inputs can exclude them by construction.
CREATE TABLE patient_identifier (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patient(id),
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('NHS_NUMBER','MRN','RIS_PATIENT_ID','OTHER')),
  value TEXT NOT NULL,
  ${ts},
  UNIQUE (identifier_type, value)
);

CREATE TABLE sirt_episode (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patient(id),
  episode_number INTEGER NOT NULL CHECK (episode_number >= 1),
  previous_episode_id TEXT REFERENCES sirt_episode(id),
  registry_episode_id TEXT,
  ${ts},
  UNIQUE (patient_id, episode_number)
);

CREATE TABLE study (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES sirt_episode(id),
  accession_hash TEXT,
  modality TEXT,
  study_datetime TEXT,
  description TEXT,
  ${ts}
);

CREATE TABLE capture_session (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES sirt_episode(id),
  state TEXT NOT NULL CHECK (state IN ('CREATED','RUNNING','PAUSED','FAILED','COMPLETED','ABORTED')),
  connector TEXT NOT NULL,
  operator TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  last_error TEXT,
  ${ts}
);

CREATE TABLE capture_checkpoint (
  id TEXT PRIMARY KEY,
  capture_session_id TEXT NOT NULL REFERENCES capture_session(id),
  sequence INTEGER NOT NULL,
  step TEXT NOT NULL,
  item_key TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('OK','BLANK','NOT_FOUND','DUPLICATE','SKIPPED','ERROR','PATIENT_MISMATCH')),
  detail TEXT,
  ${ts},
  UNIQUE (capture_session_id, sequence)
);

CREATE TABLE source_document (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES sirt_episode(id),
  study_id TEXT REFERENCES study(id),
  capture_session_id TEXT REFERENCES capture_session(id),
  source_order INTEGER NOT NULL,
  title TEXT,
  source_type TEXT,
  clinical_date TEXT,
  report_date TEXT,
  capture_method TEXT NOT NULL CHECK (capture_method IN (${sqlInList(CAPTURE_METHODS)})),
  raw_text TEXT NOT NULL,
  text_sha256 TEXT NOT NULL,
  normalised_sha256 TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  document_class TEXT NOT NULL DEFAULT 'UNCERTAIN' CHECK (document_class IN (${sqlInList(DOCUMENT_CLASSES)})),
  class_confidence REAL CHECK (class_confidence IS NULL OR (class_confidence >= 0 AND class_confidence <= 1)),
  class_reasoning TEXT,
  class_needs_review INTEGER NOT NULL DEFAULT 1 CHECK (class_needs_review IN (0,1)),
  class_confirmed_by TEXT,
  included INTEGER NOT NULL DEFAULT 1 CHECK (included IN (0,1)),
  inclusion_reason TEXT,
  duplicate_of_id TEXT REFERENCES source_document(id),
  addendum_of_id TEXT REFERENCES source_document(id),
  ${ts},
  UNIQUE (episode_id, text_sha256)
);
CREATE INDEX ix_source_document_episode_date ON source_document(episode_id, clinical_date, source_order);

CREATE TRIGGER source_document_text_immutable
BEFORE UPDATE OF raw_text, text_sha256, normalised_sha256, capture_method, captured_at ON source_document
BEGIN
  SELECT RAISE(ABORT, 'source_document evidence is immutable');
END;
CREATE TRIGGER source_document_no_delete
BEFORE DELETE ON source_document
BEGIN
  SELECT RAISE(ABORT, 'source_document rows cannot be deleted; exclude them instead');
END;

CREATE TABLE source_evidence (
  id TEXT PRIMARY KEY,
  source_document_id TEXT NOT NULL REFERENCES source_document(id),
  char_start INTEGER NOT NULL CHECK (char_start >= 0),
  char_end INTEGER NOT NULL,
  quoted_text TEXT NOT NULL,
  ${ts},
  CHECK (char_end > char_start)
);
CREATE TRIGGER source_evidence_immutable
BEFORE UPDATE ON source_evidence
BEGIN
  SELECT RAISE(ABORT, 'source_evidence is immutable');
END;
-- quoted_text must be exactly the referenced span of the source document.
CREATE TRIGGER source_evidence_span_matches
BEFORE INSERT ON source_evidence
WHEN (SELECT substr(raw_text, NEW.char_start + 1, NEW.char_end - NEW.char_start) FROM source_document WHERE id = NEW.source_document_id) IS NOT NEW.quoted_text
BEGIN
  SELECT RAISE(ABORT, 'source_evidence quoted_text does not match the source document span');
END;

CREATE TABLE baseline_assessment (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES sirt_episode(id),
  assessment_date TEXT,
  anchor_document_id TEXT REFERENCES source_document(id),
  ${ts}
);

CREATE TABLE treatment_territory (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES sirt_episode(id),
  label TEXT NOT NULL,
  lobe TEXT,
  segments TEXT,
  ${ts},
  UNIQUE (episode_id, label)
);

CREATE TABLE tumour_lesion (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES sirt_episode(id),
  lesion_label TEXT NOT NULL,
  territory_id TEXT REFERENCES treatment_territory(id),
  registry_lesion_id TEXT,
  ${ts},
  UNIQUE (episode_id, lesion_label)
);

CREATE TABLE mapping_procedure (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES sirt_episode(id),
  procedure_date TEXT,
  source_document_id TEXT REFERENCES source_document(id),
  registry_mapping_session_id TEXT,
  ${ts}
);

CREATE TABLE maa_study (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES sirt_episode(id),
  mapping_procedure_id TEXT REFERENCES mapping_procedure(id),
  study_date TEXT,
  ${ts}
);

CREATE TABLE dosimetry_plan (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES sirt_episode(id),
  maa_study_id TEXT REFERENCES maa_study(id),
  territory_id TEXT REFERENCES treatment_territory(id),
  plan_date TEXT,
  ${ts}
);

CREATE TABLE y90_treatment (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES sirt_episode(id),
  dosimetry_plan_id TEXT REFERENCES dosimetry_plan(id),
  treatment_date TEXT,
  sequence_number INTEGER NOT NULL CHECK (sequence_number >= 1),
  ${ts},
  UNIQUE (episode_id, sequence_number)
);

CREATE TABLE y90_administration (
  id TEXT PRIMARY KEY,
  y90_treatment_id TEXT NOT NULL REFERENCES y90_treatment(id),
  position_number INTEGER NOT NULL CHECK (position_number >= 1),
  territory_id TEXT REFERENCES treatment_territory(id),
  ${ts},
  UNIQUE (y90_treatment_id, position_number)
);

CREATE TABLE procedure_vessel (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES sirt_episode(id),
  mapping_procedure_id TEXT REFERENCES mapping_procedure(id),
  y90_administration_id TEXT REFERENCES y90_administration(id),
  vessel_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN (${sqlInList(VESSEL_ROLES)})),
  territory_id TEXT REFERENCES treatment_territory(id),
  lesion_id TEXT REFERENCES tumour_lesion(id),
  ${ts},
  CHECK (mapping_procedure_id IS NOT NULL OR y90_administration_id IS NOT NULL)
);

CREATE TABLE post_treatment_dosimetry (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES sirt_episode(id),
  y90_treatment_id TEXT REFERENCES y90_treatment(id),
  modality TEXT CHECK (modality IS NULL OR modality IN ('PET_CT','SPECT_CT','OTHER')),
  scan_date TEXT,
  ${ts}
);

CREATE TABLE follow_up_episode (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES sirt_episode(id),
  imaging_date TEXT,
  modality TEXT,
  interval_days INTEGER,
  interval_window TEXT CHECK (interval_window IS NULL OR interval_window IN (${sqlInList(FOLLOW_UP_WINDOWS)})),
  ${ts}
);

CREATE TABLE lesion_follow_up (
  id TEXT PRIMARY KEY,
  follow_up_id TEXT NOT NULL REFERENCES follow_up_episode(id),
  lesion_id TEXT NOT NULL REFERENCES tumour_lesion(id),
  ${ts},
  UNIQUE (follow_up_id, lesion_id)
);

CREATE TABLE laboratory_episode (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES sirt_episode(id),
  collected_date TEXT,
  context TEXT NOT NULL CHECK (context IN (${sqlInList(LAB_CONTEXTS)})),
  ${ts}
);

CREATE TABLE complication (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES sirt_episode(id),
  onset_date TEXT,
  procedure_type TEXT CHECK (procedure_type IS NULL OR procedure_type IN ('MAPPING','Y90','FOLLOW_UP','OTHER')),
  procedure_id TEXT,
  ${ts}
);

CREATE TABLE subsequent_treatment (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES sirt_episode(id),
  start_date TEXT,
  ${ts}
);

CREATE TABLE outcome (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL UNIQUE REFERENCES sirt_episode(id),
  ${ts}
);

CREATE TABLE calculation_run (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES sirt_episode(id),
  formula_id TEXT NOT NULL,
  formula_version TEXT NOT NULL,
  calculation_version TEXT NOT NULL,
  input_field_value_ids TEXT NOT NULL,
  inputs_snapshot TEXT NOT NULL,
  result TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('CALCULATED','NOT_CALCULABLE')),
  calculated_at TEXT NOT NULL,
  ${ts}
);
CREATE TRIGGER calculation_run_immutable
BEFORE UPDATE ON calculation_run
BEGIN
  SELECT RAISE(ABORT, 'calculation_run is immutable');
END;

CREATE TABLE ai_interpretation (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES sirt_episode(id),
  task TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  model_version TEXT,
  prompt_sha256 TEXT NOT NULL,
  input_field_value_ids TEXT NOT NULL,
  pseudonymised INTEGER NOT NULL CHECK (pseudonymised IN (0,1)),
  output_text TEXT NOT NULL,
  label TEXT NOT NULL CHECK (label = 'AI_GENERATED_CLINICIAN_REVIEW_REQUIRED'),
  review_status TEXT NOT NULL DEFAULT 'UNREVIEWED' CHECK (review_status IN ('UNREVIEWED','ACCEPTED','REJECTED')),
  reviewed_by TEXT,
  reviewed_at TEXT,
  ${ts}
);
CREATE TRIGGER ai_interpretation_output_immutable
BEFORE UPDATE OF output_text, task, provider, model, model_version, prompt_sha256, input_field_value_ids, label ON ai_interpretation
BEGIN
  SELECT RAISE(ABORT, 'ai_interpretation output is immutable');
END;

CREATE TABLE field_value (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES sirt_episode(id),
  entity_type TEXT NOT NULL CHECK (entity_type IN (${sqlInList(ENTITY_TYPES)})),
  entity_id TEXT NOT NULL,
  field_key TEXT NOT NULL,
  value_text TEXT,
  value_num REAL,
  value_date TEXT,
  unit TEXT,
  source_document_id TEXT REFERENCES source_document(id),
  source_evidence_id TEXT REFERENCES source_evidence(id),
  source_date TEXT,
  source_type TEXT,
  source_text TEXT,
  extraction_method TEXT NOT NULL CHECK (extraction_method IN (${sqlInList(EXTRACTION_METHODS)})),
  extractor_version TEXT NOT NULL,
  calculation_run_id TEXT REFERENCES calculation_run(id),
  ai_interpretation_id TEXT REFERENCES ai_interpretation(id),
  confidence REAL CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  status TEXT NOT NULL CHECK (status IN (${sqlInList(VALUE_STATUSES)})),
  verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED' CHECK (verification_status IN (${sqlInList(VERIFICATION_STATUSES)})),
  verified_value TEXT,
  verified_unit TEXT,
  verification_user TEXT,
  verification_date TEXT,
  ${ts},
  CHECK (status <> 'AI_INFERRED' OR ai_interpretation_id IS NOT NULL),
  CHECK (status <> 'CALCULATED' OR calculation_run_id IS NOT NULL),
  CHECK (extraction_method NOT IN ('DIRECT_TEXT_RULE','PDF_TEXT_RULE','OCR_RULE') OR source_document_id IS NOT NULL),
  CHECK (extraction_method <> 'AI_SUGGESTION' OR status IN ('AI_INFERRED','CLINICIAN_VERIFIED','CONFLICT','UNCERTAIN')),
  CHECK (extraction_method <> 'OCR_RULE' OR confidence IS NULL OR confidence <= 0.6),
  CHECK (status <> 'CLINICIAN_VERIFIED' OR (verification_user IS NOT NULL AND verification_date IS NOT NULL))
);
CREATE INDEX ix_field_value_lookup ON field_value(entity_type, entity_id, field_key);
CREATE INDEX ix_field_value_episode ON field_value(episode_id, field_key);

CREATE TRIGGER field_value_original_immutable
BEFORE UPDATE OF episode_id, entity_type, entity_id, field_key, value_text, value_num, value_date, unit,
  source_document_id, source_evidence_id, source_date, source_type, source_text,
  extraction_method, extractor_version, calculation_run_id, ai_interpretation_id, confidence ON field_value
BEGIN
  SELECT RAISE(ABORT, 'field_value original value and provenance are immutable; record a verification instead');
END;
CREATE TRIGGER field_value_no_delete
BEFORE DELETE ON field_value
BEGIN
  SELECT RAISE(ABORT, 'field_value rows cannot be deleted; reject them via verification');
END;

CREATE TABLE conflict (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES sirt_episode(id),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  field_key TEXT NOT NULL,
  candidate_field_value_ids TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('OPEN','RESOLVED')),
  resolved_field_value_id TEXT REFERENCES field_value(id),
  resolved_by TEXT,
  resolved_at TEXT,
  resolution_reason TEXT,
  ${ts},
  CHECK (state <> 'RESOLVED' OR (resolved_by IS NOT NULL AND resolved_at IS NOT NULL AND resolution_reason IS NOT NULL))
);
CREATE UNIQUE INDEX ux_conflict_open ON conflict(entity_type, entity_id, field_key) WHERE state = 'OPEN';

CREATE TABLE clinician_verification (
  id TEXT PRIMARY KEY,
  field_value_id TEXT NOT NULL REFERENCES field_value(id),
  action TEXT NOT NULL CHECK (action IN ('VERIFY','CORRECT','REJECT','MARK_NOT_DOCUMENTED','RESOLVE_CONFLICT','MARK_UNCERTAIN')),
  previous_value TEXT,
  new_value TEXT,
  new_unit TEXT,
  reason TEXT,
  verification_user TEXT NOT NULL,
  verification_timestamp TEXT NOT NULL,
  ${ts},
  CHECK (action <> 'CORRECT' OR (reason IS NOT NULL AND length(trim(reason)) >= 10))
);
CREATE TRIGGER clinician_verification_append_only_u BEFORE UPDATE ON clinician_verification
BEGIN SELECT RAISE(ABORT, 'clinician_verification is append-only'); END;
CREATE TRIGGER clinician_verification_append_only_d BEFORE DELETE ON clinician_verification
BEGIN SELECT RAISE(ABORT, 'clinician_verification is append-only'); END;

CREATE TABLE audit_event (
  id TEXT PRIMARY KEY,
  occurred_at TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  previous_value TEXT,
  new_value TEXT,
  extractor_version TEXT,
  calculation_version TEXT,
  ai_model TEXT,
  metadata TEXT
);
CREATE INDEX ix_audit_event_entity ON audit_event(entity_type, entity_id, occurred_at);
CREATE TRIGGER audit_event_append_only_u BEFORE UPDATE ON audit_event
BEGIN SELECT RAISE(ABORT, 'audit_event is append-only'); END;
CREATE TRIGGER audit_event_append_only_d BEFORE DELETE ON audit_event
BEGIN SELECT RAISE(ABORT, 'audit_event is append-only'); END;
`;
