# Phase 0 addendum — Audit of the live registry: RLH IR Oncology System M8.5 v116.15

Source: `RLH_M8_5_V116_15_SIRT_FIELD_HARMONISATION_FROZEN_2026-09-22.html` (supplied 2026-10-02, 2.39 MB, 58 script blocks).
**The file itself is NOT committed to this repository** (see F0). This document contains no patient data.

Evidence key: FACT = read in code or reproduced by execution; INFERENCE = reasoned, not executed; UNKNOWN.

## 1. What V116 is

- Single-file browser application, `NS.VERSION = 0.8.5-m8.5-v116.x`, data schema version 2, persisted in **IndexedDB** `RLH_IR_ONCOLOGY_RECOVERY_ONLY_M85_V2` (stores: `patients`, `audit`, `config`, `metadata`). FACT.
- Modules: patients, HBP MDT (frozen MDT v22.30.1 engine), pathology, **SIRT**, MWA, follow-up, complications, registry/cohort views, validation layer, unified "AI Clinical Import", external LLM connector, data export (JSON, XLSX, DOCX built in-browser). FACT.
- **This, not the repo's Prisma/NestJS edition, is the live registry.** Phase 5 integration targets V116 first; the Prisma edition is secondary.

### Record shape (FACT)
```
patient { patientId, demographics{ name, mrn, dob, nhsNumber, ... },
  oncologyEpisodes{ [id]: { oncologyEpisodeId, episodeDate, diagnosis, referral,
     mdtEpisodes[], pathology, outcomes, registryExtensions, sharedClinicalContext,
     treatments[]  -> SIRT/MWA treatment episode {
          treatmentEpisodeId, modality, status, mappingSessionId, maaStudyId, treatmentSessionId,
          postTreatmentImagingId, data{ 294 SIRT field defs }, treatmentPositions[],
          mapping/treatmentProjectionAngles[], mapping/treatmentNonTargetVessels[],
          provenance{ fieldKey -> {value, unit, source, sourceDate, sourceSnippet, confidence,
                                   reviewStatus, reviewedBy, reviewedAt, origin, ...} },
          audit[], aiImports[], reports{mapping, maa, treatment, post} },
     followUp[]    -> events { date, timepoint, imagingModality, response, labs (incl. ALT/AST/ALP/AFP/CEA/CA19-9),
                               ALBI/Child-Pugh (calculated + reported), progression fields, toxicity attribution,
                               lesionResponses[]{ lesionId, enhancingDiameterMm, wholeLesionDiameterMm,
                                                  mrecist, recist11, liradsTreatmentResponse } },
     complications[] } } }
```

SIRT field set: 294 definitions in 22 sections, including CBCT perfused/tumour volume, CBCT and MAA **A/T (angiosome-to-tumour volume) ratios**, MAA findings, device-specific activity planning, planned dosimetry, delivery (prescribed/assayed/delivered/residual), planned-vs-actual QA, voxel dosimetry (D90/D70/V100), post-Y90 imaging. **Most of the "registry gaps" identified against the Prisma schema are already fields in V116.**

## 2. Reusable strengths (KEEP)

| Feature | Why |
|---|---|
| Patient → oncology episode → treatments[]/followUp[]/complications[] | Correct one-to-many structure; multiple SIRT treatments, positions, follow-ups, lesion responses. |
| Per-field `provenance` map + `audit[]` before/after | Closest existing analogue to the extractor's provenance model. |
| Unified AI Clinical Import lifecycle (RAW → EXTRACT → EVIDENCE → CONFLICT vs current → CLINICIAN REVIEW → FINALISE → COMMIT) | The extractor should feed this pipeline, not replace it. |
| Identity check: MRN/DOB in source vs selected patient; **mismatch blocks commit** | Wrong-patient safety. Reuse the same rule in capture. |
| Follow-up Child-Pugh computed **only with all 5 components** | Correct strict behaviour (unlike the Prisma edition's 2/5). |
| v116.15 calc provenance (`origin: sirt-auto-calc`), clinician override blocks autofill | Good pattern. |
| External LLM connector: approval gate, redaction default on, verbatim-evidence check, proposals → review, allow-listed fields | Sound skeleton (see F9 for gaps). |

## 3. Findings

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| **F0** | **CRITICAL (information governance)** | The HTML embeds a data block (`v116.5-v113-excel-full-data-merge`, script block 49) containing **74 patient rows with name, MRN, date of birth, sex and OS/PFS event data**. The file is labelled "FROZEN" and is distributed as an application, so every copy of the application is also a copy of identifiable patient data. | FACT (pattern counts; values not reproduced here). |
| **F1** | **CRITICAL (data integrity)** | The SIRT derived-calculation engine (frozen from v113.6) treats blank inputs as 0 and **persists the results into `r.data`** on autosave. Reproduced: with only assayed activity 3.4 GBq and treatment perfused volume 980 mL entered → `deliveryEfficiency "0.0"`, `residualFraction "0.0"`, `tumourBurdenPercent "0.0"`, `calculatedNormalLiverVolume "980.0"` (as if tumour volume = 0), `activityPerPerfusedLitre "0.00"`, `perfusedVolumeVariancePercent "-100.0"`, `qaClassification "Clinically significant variance"`. Incomplete records therefore carry fabricated values and a false QA flag into the registry and exports. | FACT — executed `calculateDerived` (block 15); `collect()` → `derived(r)` → `Object.assign(r.data, out)` → `persistDraft` (block 17). |
| F2 | MAJOR | Dose engine defaults missing **TNR to 1.0** and missing **LSF to 0.0** (`|| 1.0`, `|| 0.0`). Predicted tumour dose with TNR 1 equals normal-liver dose; LSF 0 shows lung dose 0 Gy. Displayed as guardrails; banner says it does not overwrite source fields. | FACT (code); persistence of these specific outputs: INFERENCE — display only. |
| F3 | MAJOR | `maaAtRatio` silently falls back to the **mapping** tumour volume when the MAA tumour volume is blank (reproduced: 950/140 = 6.79 labelled MAA A/T). Cross-source substitution. | FACT (executed). |
| F4 | MAJOR | Dose engine input fallbacks: planned activity ← prescribed activity; target volume ← treatment CBCT → MAA → mapping CBCT. Values from different stages are interchanged without trace. | FACT (code). |
| F5 | MAJOR (needs your definition) | Dose engine subtracts residual from `deliveredActivity`; `deliveryEfficiency = delivered ÷ assayed` implies `deliveredActivity` is already net of residual. If so, residual is subtracted twice and delivered doses are underestimated. | INFERENCE — depends on how `deliveredActivity` is defined in your SOP. |
| F6 | MAJOR | Import dedupe keeps the highest-confidence candidate per field and discards others silently; commit overwrites `data[field]` and `provenance[field]` (prior provenance survives only in `audit[]`). Conflicts are detected only against the current value, not between sources. | FACT (block 28 `dedupe`, `commit`). |
| F7 | MAJOR | Source document text is not retained — only a ≤320-char snippet per proposal. `sourceTextHash` is a digest of the proposals, not of the source text. Retrospective audit back to the full report is not possible. | FACT. |
| F8 | MINOR | SIRT text parser (`parseAI` — deterministic regex despite the name) takes the first match per field; multi-position activities/vessels in one report are lost. Confidence values are hard-coded. | FACT. |
| F9 | MAJOR (privacy) | LLM redaction is regex/exact-match: narrative names ("Mr X was reviewed"), study dates and rare identifiers can pass; approval is an in-memory checkbox; any HTTPS host is permitted once approved. | FACT (code); exploitability INFERENCE. |
| F10 | MINOR | Child-Pugh bilirubin band uses ≤ 51 µmol/L for 2 points (conventional 34–50). | FACT. |
| F11 | MAJOR (maintainability) | 15+ runtime patch layers (`v116.1` … `v116.15`, "hard-repair", "runtime-fix") monkey-patch earlier modules at load time, guarded by window flags. Behaviour depends on load order; difficult to test. | FACT. |

## 4. Labels

| Feature | Label |
|---|---|
| V116 data model and SIRT field set | **KEEP** — primary integration target |
| Unified AI Clinical Import pipeline | **KEEP / REFACTOR** — keep lifecycle; add source-text retention and multi-candidate conflicts (F6, F7) |
| SIRT derived-calculation engine | **REFACTOR (urgent)** — blank ≠ 0; calculated values separate from documented ones (F1, F3) |
| Dose engine guardrails | **REFACTOR** — no defaults for TNR/LSF; explicit NOT_CALCULABLE (F2, F4, F5) |
| External LLM connector | **REFACTOR** — stronger pseudonymisation, endpoint allow-list in config, persisted approval with named approver (F9) |
| Embedded Excel merge data block | **REMOVE from the distributed application** (F0) — data belongs in the IndexedDB store, not the code |
| Runtime patch layering | **REFACTOR (later)** |

## 5. Consequences for the extractor plan

1. **Integration target changes**: Phase 5 writes V116-compatible import packages (proposals with full provenance) that enter V116's existing review → finalise → commit pipeline. No second registry.
2. The extractor's field catalogue gains V116 targets (Phase 1 revision). The Prisma mapping is retained as secondary.
3. The extractor's own calculation module must not reuse V116's `calculateDerived` or dose engine until F1–F5 are fixed.
4. **Deployment**: V116 runs as a browser file with no install. Whether the extractor can run anything other than a browser inside the Horizon desktop (PowerShell, portable Node) is now the deciding question for Phase 2 (U8).
