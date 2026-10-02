# Phase 1 — Target Architecture, Data Model and Phase 2 MVP

Status: **PROPOSED** (Phase 1 deliverable). Nothing here is an accepted release — see `VERSIONS.md`.

---

## 1. Positioning decision (the one that matters most)

**The extractor is a local, pre-verification evidence store that feeds the existing registry. It is not a second registry.**

| Concern | Lives in | Why |
|---|---|---|
| Raw source text, capture metadata, evidence spans | Extractor store (SQLite, on the workstation) | Immutable evidence; volumes and shapes the registry was never designed for. |
| Candidate values (possibly several per field, possibly conflicting) | Extractor store | A typed registry column can hold one value; conflicts need ≥2. |
| Clinician verification decisions + audit | Extractor store, carried into registry audit on push | Retrospective audit of *why* a registry value is what it is. |
| **Verified, structured clinical values** | **Existing registry** (Prisma/Postgres, or HTML-edition JSON) | Single source of truth for research/service use. |

Only `CLINICIAN_VERIFIED` (or explicitly accepted `CALCULATED` from verified inputs) values are ever pushed to the registry. The registry gets a small additive extension (Phase 5): `sourceDocumentRef` / `extractionRunId` columns or a `RegistryProvenanceLink` table, so a registry value can be traced back to extractor evidence.

This diverges from ADR-0001 decision 4 ("typed columns, not generic EAV") **only inside the extractor store**, and deliberately: pre-verification, the core requirement is *N candidate values per field with provenance*, which typed columns cannot represent. The registry stays typed.

## 2. Component architecture

```
┌──────────────────────── Windows workstation / Horizon session ─────────────────────────┐
│                                                                                       │
│  Capture layer (Phase 2)                                                              │
│   SourceConnector interface ─┬─ ManualPasteConnector      (always available)          │
│                              ├─ FileImportConnector       (.txt / text-layer PDF)     │
│                              ├─ UiAutomationConnector ──► WorkstationDriver (process) │
│                              │        config/workstation.json (selectors, timeouts —   │
│                              │        NO coordinates in code)                          │
│                              └─ OcrConnector              (fallback only, flagged)     │
│        │ CapturedDocument { text, metadata, captureMethod, sha256 }                    │
│        ▼                                                                               │
│  Capture session engine: checkpoints, pause/resume, dedupe, ordering                   │
│        ▼                                                                               │
│  Classification (Phase 3) — deterministic rules on title/metadata + content            │
│        ▼                                                                               │
│  Extraction (Phase 4) — deterministic, per document class; span-anchored evidence      │
│        ▼                                                                               │
│  Evidence store (SQLite, node:sqlite, versioned migrations, append-only audit)         │
│        ▼                                                                               │
│  Resolver ─► Conflict engine ─► Completeness engine ─► Calculation engine (Phase 7)   │
│        ▼                                                                               │
│  Clinician review UI (Phase 6)  ◄── optional AI layer (Phase 8, separate table,        │
│        ▼                             local-only by default, never writes values)       │
│  Registry adapters (Phase 5): Prisma API / HTML-edition JSON / CSV / XLSX / JSON       │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

Language: TypeScript (matches the repo; reuses the existing calculation engine directly). Storage: SQLite via Node's built-in `node:sqlite` — **zero native dependencies**, which matters on locked-down NHS Windows builds where a C++ toolchain for `better-sqlite3` will not exist. Risk: `node:sqlite` is flagged experimental in Node 22; the store is behind a thin `Database` wrapper so `better-sqlite3` can be substituted without touching callers.

The UI-automation driver is a **separate process** speaking line-delimited JSON over stdio (`open_patient`, `list_studies`, `open_report`, `copy_report_text`, `health`). Its implementation language is deliberately left open until U1/U2 are answered (PowerShell + UIAutomation, Python + pywinauto, or AutoHotkey are all viable). All brittleness lives there plus `config/workstation.json`.

### 2.1 Capture-method preference (enforced, recorded)

`DIRECT_TEXT_COPY` > `EXPORTED_TEXT` > `EXPORTED_PDF_TEXT` > `MANUAL_PASTE` > `SCREENSHOT_OCR`.
OCR is used only when no machine-readable text exists, every OCR-derived document is flagged, OCR-derived numeric values cannot exceed confidence 0.6, and every OCR-derived value requires clinician verification regardless of confidence.

### 2.2 Horizon reality check (judgement, not fact — depends on U1/U2)

If the extractor runs on the **physical client**, Horizon presents RIS/PACS as pixels: Windows UI Automation cannot see inside the remote session. Then the only text paths are (a) clipboard redirection agent→client, or (b) screenshot + OCR. If clipboard redirection is disabled by Trust policy, the brief's preference order cannot be honoured from the client side. **Recommendation: run the extractor inside the Horizon desktop alongside RIS/PACS**, or ask IT for a report export / HL7 ORU feed — the latter is more robust than any UI scraping and should be raised now, in parallel.

## 3. Domain model

All entities carry `id`, `created_at`, `updated_at`. Clinical values are **not** columns on these tables; they are `field_value` rows attached to `(entity_type, entity_id, field_key)` with full provenance (§4). Entity tables hold structure (identity, relationships, ordering dates) only.

| Entity | Cardinality | Key structural columns |
|---|---|---|
| `Patient` | 1 | `local_key` (pseudonymous), `registry_patient_id`. Identifiers in separate `patient_identifier` table so they can be excluded from every export by construction. |
| `SIRTEpisode` | Patient 1→N | `episode_number`, `registry_episode_id`, `previous_episode_id` |
| `Study` | Episode 1→N | `accession_hash`, `modality`, `study_datetime`, `description` |
| `SourceDocument` | Study 1→N (report + addenda) | immutable `raw_text`, `text_sha256`, `capture_method`, `document_class` (+ confidence, reasoning JSON, review flag), `source_order`, `included`, `duplicate_of_id`, `addendum_of_id` |
| `SourceEvidence` | Document 1→N | `char_start`, `char_end`, `quoted_text` (must equal the substring) |
| `BaselineAssessment` | Episode 1→N (usually 1) | `assessment_date`, `anchor_document_id` |
| `TumourLesion` | Episode 1→N | `lesion_label`, `segments`, `target_status` |
| `TreatmentTerritory` | Episode 1→N | `label`, `lobe`, `segments` |
| `MappingProcedure` | Episode 1→N | `procedure_date` |
| `ProcedureVessel` | Mapping/Y90 1→N | `vessel_name`, `role` (TARGET, TUMOUR_FEEDER, EMBOLISED, MAA_INJECTION, Y90_ADMINISTRATION, VARIANT), `territory_id`, `lesion_id` |
| `MAAStudy` | Mapping 1→N | `study_date` |
| `DosimetryPlan` (predicted) | Episode 1→N; per territory | `maa_study_id`, `territory_id` |
| `Y90Treatment` | Episode 1→N (staged/bilobar) | `treatment_date`, `dosimetry_plan_id` |
| `Y90Administration` | Treatment 1→N | `position_number`, `vessel_name`, `territory_id` |
| `PostTreatmentDosimetry` (delivered) | Treatment 1→N | `modality` (PET_CT/SPECT_CT), `scan_date` |
| `FollowUpEpisode` | Episode 1→N | `imaging_date`, `modality`, `interval_days` (from first Y-90), `window` (EARLY, M3, M6, M9, M12, LATE — derived, not forced) |
| `LesionFollowUp` | FollowUp × Lesion | per-lesion serial dimensions/enhancement/status |
| `LaboratoryEpisode` | Episode 1→N | `collected_date`, `context` (BASELINE, PRE_MAPPING, PRE_Y90, FOLLOW_UP) |
| `Complication` | Episode 1→N, optional procedure link | `onset_date`, `procedure_type`, `procedure_id` |
| `SubsequentTreatment` | Episode 1→N | `start_date` |
| `Outcome` | Episode 1→1 | — |
| `FieldValue` (= value + provenance) | any entity 1→N per field | see §4 |
| `Conflict` | field 1→1 open | candidate list, resolution |
| `CalculationRun` | any entity 1→N | formula id/version, input `field_value` ids, result |
| `AIInterpretation` | Episode 1→N | task, provider, model, version, prompt hash, input ids, output, fixed label |
| `ClinicianVerification` | FieldValue 1→N (append-only) | action, previous/new value, user, timestamp, reason |
| `CaptureSession` / `CaptureCheckpoint` | Episode 1→N | state machine + last completed step |
| `AuditEvent` | global, append-only | entity, action, before/after, user, versions |

One-to-many is real everywhere the brief demands: multiple episodes, lesions, territories, arteries, Y-90 administrations, follow-ups. Nothing is collapsed into a "dominant lesion".

Predicted (`DosimetryPlan`) and delivered (`PostTreatmentDosimetry`) are separate entities; there is no code path that copies one into the other.

## 4. Provenance model

Each `field_value` row:

```
value_text | value_num | value_date, unit,
source_document_id, source_evidence_id, source_date, source_type, source_text,
extraction_method (DIRECT_TEXT_RULE | PDF_TEXT_RULE | OCR_RULE | MANUAL_ENTRY | CALCULATION | AI_SUGGESTION),
extractor_version, calculation_run_id, ai_interpretation_id,
confidence (0–1),
status ∈ {EXTRACTED, CALCULATED, AI_INFERRED, CLINICIAN_VERIFIED, CONFLICT, NOT_DOCUMENTED, UNCERTAIN},
verification_status ∈ {UNVERIFIED, VERIFIED, CORRECTED, REJECTED},
verified_value, verified_unit, verification_user, verification_date
```

Database-enforced invariants (SQLite triggers, tested):
1. `source_document.raw_text` and `text_sha256` are immutable.
2. `field_value` original value, unit, source and method columns are immutable; only status/verification columns change.
3. `clinician_verification` and `audit_event` are append-only (no UPDATE, no DELETE).
4. `AI_INFERRED` values must reference an `ai_interpretation`; `CALCULATED` values must reference a `calculation_run`.
5. `EXTRACTED` values must reference a source document.

Resolution (TypeScript resolver, deterministic): verified value wins → else ≥2 distinct non-rejected candidates ⇒ `CONFLICT` (never auto-chosen) → else single candidate → else explicit `NOT_DOCUMENTED` → else `MISSING`.

## 5. Privacy and clinical-safety design

- Default AI provider: `none`. Second option `local` (on-workstation/enterprise endpoint on an allow-listed host). Any non-local provider requires a pseudonymisation pass (identifiers, names, dates shifted per-patient, accession numbers removed) and an explicit config flag; transmission is refused otherwise.
- Patient identifiers are stored only in `patient_identifier`; exports and AI inputs are built from tables that do not contain them.
- The SQLite file should sit on an encrypted, Trust-managed location (BitLocker / VDI persistent disk). **UNKNOWN U8** — governance to confirm.
- LLMs never compute ALBI/MELD/Child-Pugh/ratios/response; those come only from the calculation module with versioned formulas and unit tests.

## 6. Phase 2 MVP — "Capture Complete SIRT Patient"

Scope (single patient, single operator, workstation):

1. Start/resume a capture session for a patient/episode (pseudonymous local key; identifier entered by user, stored only in `patient_identifier`).
2. Connectors in MVP: **ManualPaste** and **FileImport (.txt; PDF text layer)** fully working; **UiAutomation** as interface + config schema + a fake driver for tests; real driver after U1–U3. OCR connector interface only (no engine bundled).
3. For each candidate document: capture metadata (title, modality, study date, report date, accession → hashed), text, capture method, SHA-256.
4. Duplicate detection: exact (hash) and near (normalised-whitespace hash + same accession/date); duplicates kept, linked, excluded by default.
5. Preserve source ordering (`source_order` as captured) **and** produce a chronological timeline (by clinical date; ties by source order).
6. Manual include/exclude with reason (audited).
7. Checkpoint after every document; crash → resume at next uncaptured item; idempotent re-capture (same hash ⇒ no duplicate row).
8. Failure handling contracts: blank report → `BLANK` status, retried N times then flagged; slow load → configurable wait with readiness predicate (not fixed sleeps); focus loss → driver re-asserts window and re-validates patient banner before copy; missing study → recorded as `NOT_FOUND`; patient-banner mismatch → **hard stop** (wrong-patient safety).

Out of scope for Phase 2: classification beyond a stub, extraction, registry push, AI.

## 7. Acceptance criteria

Defined in `acceptance_test_spec.md`. Release rule: **any CRITICAL failure blocks release; no version is accepted until the full reference-patient suite passes.**

## 8. Decisions and open items (updated 2026-10-02)

| ID | Item | Status |
|---|---|---|
| U1 | Where the extractor runs | **DECIDED: inside the Horizon desktop**, alongside RIS/PACS. UI Automation of RIS/PACS windows is then possible, and copy/paste happens within the session. |
| U2 | Horizon clipboard redirection policy | UNKNOWN — **no longer blocking**: with U1 decided, copy happens inside the remote session and redirection is not needed. |
| U3 | RIS/PACS products, export/HL7 options | UNKNOWN. Phase 2 will include a read-only "probe" that records window titles/UI structure to build `config/workstation.json`. The HL7/export question should still go to IT. |
| U4 | Live registry | **SUPPLIED: V116.15.** It replaces Prisma as the primary integration target. See `02_v116_registry_audit.md`. |
| U5 | Follow-up windows | **APPROVED**: EARLY < 60 d; M3 60–135 d; M6 136–225 d; M9 226–315 d; M12 316–450 d; LATE > 450 d (days from first Y-90 administration). |
| U8 | What can execute inside the Horizon desktop (browser only? PowerShell? portable Node?) | **OPEN — now blocks the Phase 2 runtime choice.** |
| IG-1 | V116 contains embedded identifiable patient data (audit F0) | **OPEN — for the registry owner / IG lead.** |
