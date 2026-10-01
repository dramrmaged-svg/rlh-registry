# Phase 0 — Repository Audit (SIRT Patient Episode Extractor)

Audit date: 2026-10-01. Branch audited: `main` @ `b8325788`.
No files were modified before this audit was completed.

Evidence key: **FACT** = verified by reading code / running it. **INFERENCE** = reasoned from code, not executed. **UNKNOWN** = cannot be determined from the repository.

---

## 1. Headline findings

1. **FACT — There is no Windows, Horizon, RIS/PACS, clipboard, screenshot or OCR automation anywhere in the repository.** A full-text search for `horizon|omnissa|pyautogui|pywinauto|autohotkey|ocr|tesseract|screenshot|clipboard|pacs` outside `node_modules` returns nothing. "Reuse existing Windows/Horizon automation" is therefore not possible from this repo. If such scripts exist, they live elsewhere — **UNKNOWN**, please attach them if so.
2. **FACT — There is no AI/LLM code.** No provider SDKs, no prompts, no model calls.
3. **FACT — The registry is a credible, well-structured episode-centric registry** (NestJS + Prisma + PostgreSQL, React front end, plus a standalone single-file HTML edition). Its core architectural decision (Patient → Episode → children, never overwrite a prior episode) is correct and is kept.
4. **FACT — The registry has no concept of a source document, source evidence, extraction method, confidence, or field-level verification.** Every clinical value is a bare typed column. This is the central gap the extractor must close.
5. **FACT — Large parts of the requested SIRT data set have no registry home** (CBCT, A/T ratios, predicted vs delivered dose, Y-90 residual activity, ALT/AST/ALP, neutrophils, CEA/CA19-9, Ki-67, sarcopenia, per-lesion serial response). See `field_mapping.md` §Gaps.
6. **FACT — `apps/api/node_modules` (26,836 files) and `apps/api/dist` (137 files) are committed to git, as is `apps/api/.env` containing a JWT secret.** There is no `.gitignore` at repo root or in `apps/api`.
7. **UNKNOWN — the "attached existing SIRT registry".** The ADR references a legacy `RLH_SIRT_Registry_v105_verified_engine_NO_PID.html` (flat one-row-per-patient registry). That file is **not in this repository**. The field mapping below is therefore against the *current* registry (Prisma schema + HTML v2 edition). If v105 is still the production registry holding real data, it must be supplied before Phase 5.

---

## 2. Project structure

```
/README.md
/RLH_SIRT_Registry_v2.html            standalone single-file registry (localStorage), ~83 KB
/apps/api                             NestJS 10 + Prisma 5 + PostgreSQL
    prisma/schema.prisma              776 lines, 24 models
    prisma/migrations/2025..._episode_architecture/migration.sql   (single migration)
    prisma/seed.ts                    vocabularies + bootstrap admin
    src/calculations/                 pure calculation engine + specs
    src/{patients,episodes,diagnosis,lesions,mapping,dosimetry,treatment,followup,toxicity,mdt}/
    src/{auth,users,audit,prisma,vocabularies,common}/
    src/test/                         Postgres-backed integration tests
    docs/adr/0001-episode-architecture.md
    dist/  node_modules/  .env        ← committed (see §9)
/apps/web                             React 18 + Vite + react-router (no node_modules present)
```

## 3. Languages / frameworks

| Layer | Tech | Status |
|---|---|---|
| API | TypeScript 5, NestJS 10, Prisma 5, class-validator, passport-jwt, bcrypt, throttler | FACT |
| DB | PostgreSQL (Prisma `provider = "postgresql"`, `@db.Decimal` native types) | FACT |
| Web | React 18, Vite 5, TypeScript | FACT |
| Standalone | Vanilla JS in one HTML file, `localStorage` key `rlh_sirt_registry_v2`, `schemaVersion: 2` | FACT |
| Tests | Jest + ts-jest; unit (85 tests, **all pass** — run during this audit); integration requires Postgres on :5433 (not run — no DB in this environment) | FACT |
| Runtime | Node 22.22 available; built-in `node:sqlite` (SQLite 3.50.4) verified working | FACT |

## 4. Current Windows automation

None (FACT). Consequently there are no hard-coded coordinates, no brittle window-title matching, no sleeps-as-synchronisation to refactor — and also nothing to reuse.

## 5. SIRT registry architecture

- `Patient` (identifiable: names, DOB, identifiers in `PatientIdentifier` incl. NHS number) → `Episode` (17-status workflow, FIRST/REPEAT with `previousEpisodeId` chain).
- Episode children: `Diagnosis` (1:1, calculated vs confirmed staging columns), `MdtRecord`, `ClinicalScore`, `LabPanel`, `ClinicalSnapshot`, `ImagingStudy` (phase-discriminated), `Lesion` (+`LesionFeeder`), `MappingSession` (+`MaaStudy`), `DosimetryPlan` (approval lock), `TreatmentSession` (+`LesionDoseInjection` per lesion/feeder), `FollowUp`, `ToxicityEvent`, `EpisodeOutcome`.
- Cross-cutting: `CalculationAudit` (formula id/version/inputs/result), `AuditLog` (before/after snapshots, changed fields), `Vocabulary`/`VocabularyOption` (table-driven controlled lists), optimistic locking (`version`), soft delete via Prisma middleware.
- Readiness rules: hard BLOCK vs override-able WARNING (≥10-char reason) — good pattern, reused.

Strengths worth keeping: episode isolation, calculated-vs-confirmed separation, formula versioning, explicit preservation (not silent fixing) of legacy formula defects, transactional audit logging.

Structural weaknesses relative to the extractor goal (FACT unless marked):
- No multi-candidate values: a column holds one value, so two disagreeing reports cannot both be stored → conflicts cannot be represented.
- `MaaStudy.lungShuntFraction Decimal(6,3)` — unit ambiguous (fraction 0–1 vs percent). The calculation consumes it as **percent**; the HTML edition names it `maaLungShuntFractionPercent`. Unit is not stored. **Clinical-safety risk** (a 0.08 fraction would band as "LOW" when entered as fraction of an 8% shunt — happens to be correct band here, but e.g. 0.12 vs 12% differs).
- `FollowUp` has a single nullable `lesionId` + free-text `overallResponse` — per-lesion serial measurements are not modelled (no dimensions on follow-up).
- `Lesion` stores only baseline diameters; no enhancement, no vascular-invasion relationship, no territory link.
- `DosimetryPlan` holds predicted/prescribed only; no delivered dosimetry entity. `TreatmentSession.administeredActivityGbq` is one number per session; residual activity, % delivered, per-position administrations are absent (`LesionDoseInjection` partially covers per-lesion/feeder delivered activity).
- `LabPanel` lacks ALT, AST, ALP, neutrophils, CEA, CA19-9, eGFR.
- `Diagnosis` lacks histology type, grade, Ki-67, primary-tumour site (only `tumourType` vocabulary + `histologyConfirmed` boolean).
- `RecalculateDiagnosisDto` takes lab inputs **transiently and does not persist them** (by design, per code comment) — the inputs behind a stored calculated score are only recoverable from `CalculationAudit.inputsSnapshot` JSON.

## 6. Data storage

| Store | Where | Notes |
|---|---|---|
| PostgreSQL | server edition | Single migration; Prisma migrations = schema versioning (good). |
| Browser `localStorage` | HTML edition | Single-browser, unencrypted, no audit beyond a per-episode timeline. Clearing browser data loses data. Holds identifiable data (name, DOB, NHS number, MRN). |

## 7. Import / export

- HTML edition: JSON backup export/import (whole-DB replace with confirm). FACT.
- Server edition: **no import, no export, no CSV/Excel, no reports** (README "Not yet built"). FACT.
- No legacy-v105 importer. FACT.

## 8. Existing calculation functions

All in `apps/api/src/calculations`, pure, typed `CalculationResult<T>` with `status/formulaVersion/sourceFields/missingFields/explanation`, registered in `FORMULA_REGISTRY`, unit-tested.

| Function | Assessment |
|---|---|
| Age, BMI, BSA (Mosteller) | Correct. KEEP. |
| ALBI | Matches Johnson 2015 (log10 bili µmol/L × 0.66 − 0.085 × alb g/L; cut-offs −2.60/−1.39). KEEP. |
| Child-Pugh | **Computes a class from as few as 2/5 components** (legacy behaviour, flagged, `componentsUsed` exposed). Bilirubin band uses `≤51` for 2 points (conventional: 34–50). For extractor use this violates "calculate only when sufficient inputs exist". REFACTOR: add a strict wrapper requiring all 5 components; do **not** change the legacy function silently. |
| MELD 3.0 | Formula terms and bounds consistent with Kim et al. 2021. Unknown/unset sex treated as male (flagged). KEEP with strict-input wrapper (sex must be documented). |
| MELD-Na | Applies 2016 Na correction **on top of MELD 3.0** — double sodium adjustment, flagged `UNVERIFIED` in the version string. Not a validated score. Extractor must **not** use it. REPLACE (for extractor purposes) with classic MELD → MELD-Na from MELD(i) when needed, as a new versioned formula; leave legacy function untouched. |
| BCLC 2022 | Stage 0 unreachable (flagged). Uses Child-Pugh possibly computed from 2/5 components. Not required for extractor Phase 7; KEEP but do not auto-populate from extracted data without verification. |
| Lung-shunt risk band | Percent input; unit ambiguity upstream (see §5). KEEP; enforce unit at extractor boundary. |
| Missing (required by brief) | % tumour-size change, interval calculations, planned-vs-delivered %, CBCT A/T, MAA A/T, follow-up window categorisation, RECIST 1.1 / mRECIST response with explicit inputs. To be added in Phase 7. |

## 9. Security / privacy issues

| # | Issue | Severity | Evidence |
|---|---|---|---|
| S1 | `apps/api/.env` committed with `JWT_SECRET` and DB credentials | HIGH (if repo ever leaves a closed environment) | `git ls-files` |
| S2 | `node_modules` + `dist` committed (supply-chain opacity, 27k files, review impossible) | MEDIUM | `git ls-files \| grep -c node_modules` = 26,836 |
| S3 | Default seeded admin password `ChangeMe123!` | MEDIUM (documented, env-overridable) | `prisma/seed.ts` |
| S4 | HTML edition stores identifiable data unencrypted in `localStorage` on a shared workstation | HIGH for NHS use | `RLH_SIRT_Registry_v2.html:541` |
| S5 | Patient search returns names; no field-level minimisation for exports (no exports yet) | LOW now | `patients.service.ts:56` |
| S6 | No pseudonymisation layer anywhere — required before any non-local AI | Design gap | — |
| S7 | Refresh token: httpOnly, sameSite strict, secure in production; access token in memory only | GOOD | `auth.service.ts:112`, `client.ts:14` |

No patient-identifiable data was found in the repository (seed/fixtures are synthetic). FACT for files read; `node_modules` was not content-audited.

## 10. Brittle code / duplicated logic / error handling / technical debt

- **Duplicated logic:** the calculation engine and vocabularies are copied verbatim into `RLH_SIRT_Registry_v2.html` (two implementations to keep in sync; README acknowledges). Every service repeats the same create/patch/remove + optimistic-lock + audit boilerplate (~15 near-identical blocks).
- **Soft delete does not cascade** (ADR-acknowledged) — children of a deleted episode remain queryable.
- **`withinTransaction` retry** only on P2034; fine.
- **Missing error handling:** HTML edition `saveDb()` has no try/catch for `localStorage` quota errors → silent data loss risk.
- **Field-level unit ambiguity** (LSF) — see §5.
- **Vocabulary cache** refresh only at boot (documented non-goal).
- **Integration tests depend on a hand-provisioned Postgres on :5433** — not runnable in CI as-is.
- **Prisma `$use` middleware** is deprecated in Prisma 5 (still works; will break on upgrade).

## 11. Feature labels

| Feature | Label | Rationale |
|---|---|---|
| Patient → Episode architecture (Prisma schema core) | **KEEP** | Correct; extractor maps into it. |
| Calculated vs confirmed staging columns | **KEEP** | Matches verification philosophy. |
| `CalculationAudit` + `FORMULA_REGISTRY` | **KEEP** | Reuse pattern in extractor calc runs. |
| Calculation functions (age/BMI/BSA/ALBI/MELD3/LSF band) | **KEEP** | Reused via strict-input wrappers. |
| Child-Pugh (2/5 component behaviour) | **REFACTOR** | Strict wrapper for extractor; legacy untouched. |
| MELD-Na (double Na adjustment) | **REPLACE** (extractor use only) | Not a validated score; never auto-populated. |
| BCLC 2022 | **KEEP** (not auto-fed) | Requires clinician-verified inputs. |
| Readiness rules (BLOCK/WARNING + override reason) | **KEEP** | Reused in completeness engine. |
| AuditLog (before/after/changed fields) | **KEEP** | Extractor audit mirrors it. |
| Vocabulary tables + seed data | **KEEP** | Extractor normalises to these codes. |
| Auth/RBAC/users | **KEEP** | Verification user identity comes from here in Phase 5/6. |
| CRUD services boilerplate | **REFACTOR** (later, not now) | Repetition; not on extractor critical path. |
| `Lesion` / `FollowUp` models | **REFACTOR** | Need per-lesion serial observations (additive migration, Phase 5). |
| `MaaStudy.lungShuntFraction` | **REFACTOR** | Unit must be explicit. |
| `DosimetryPlan` / `TreatmentSession` | **REFACTOR** | Predicted vs delivered separation; administrations. |
| `LabPanel` | **REFACTOR** | Add missing analytes (additive). |
| HTML standalone edition | **KEEP** (frozen) | Working tool; do not extend; its JSON backup format becomes one export target. |
| HTML edition localStorage for identifiable data | **UNKNOWN** | Governance decision (is it in live use with real data?). |
| Committed `node_modules`/`dist`/`.env` | **REMOVE** (from git, with your approval) | Not done unilaterally. |
| Windows/Horizon automation | **N/A — does not exist** | Built new in Phase 2 behind an interface. |
| AI layer | **N/A — does not exist** | Built new in Phase 8, optional, local-default. |

## 12. UNKNOWNs that block or shape later phases

| ID | Unknown | Blocks |
|---|---|---|
| U1 | **Horizon topology**: will the extractor run *inside* the Horizon virtual desktop (same session as RIS/PACS — UI Automation tree visible), or on the *physical* Windows client (Horizon renders pixels only — no UIA, only clipboard/keyboard)? | Phase 2 driver design |
| U2 | **Horizon clipboard redirection policy** (disabled / client→agent / agent→client / bidirectional) and file-transfer policy. If agent→client is disabled and the extractor runs on the client, the only text channel is screen capture + OCR. | Phase 2 |
| U3 | RIS and PACS product names/versions (e.g. which RIS; does it offer report print-to-PDF/text export; is there an HL7/FHIR/DICOM SR feed available to IT instead of UI scraping?) | Phase 2 |
| U4 | Legacy v105 registry file and whether it holds live data | Phase 5 |
| U5 | Where verified data lands: server edition (Postgres) or HTML edition (localStorage) in current real use | Phase 5 |
| U6 | Dosimetry software/report format (Simplicit90Y, MIM SurePlan, Hermes, local spreadsheet?) and whether reports are in RIS or a separate system | Phase 4 |
| U7 | Information-governance position: DPIA status, approved local/enterprise LLM, whether any AI processing is permitted | Phase 8 |
| U8 | Workstation constraints: can Node/Python be installed? Is software installation inside VDI permitted? | Phase 2 deployment |
