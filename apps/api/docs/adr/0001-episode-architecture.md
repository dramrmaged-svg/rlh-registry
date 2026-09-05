# ADR 0001: Patient → Episode Architecture

## Status

Accepted (Phase 1 of the RLH SIRT Registry rebuild).

## Context

The legacy `RLH_SIRT_Registry_v105_verified_engine_NO_PID.html` application stores one flat
record per patient (`patients[]`, `blankPatient()`). All clinical data — demographics, MDT,
labs, mapping, dosimetry, treatment, follow-up, outcomes — lives directly on that one row.
There is no working multi-episode support: a second SIRT treatment in the same patient
silently overwrites the first episode's mapping/dosimetry/treatment/follow-up data. A prior
attempt at a true `episode`/`lesion` architecture exists in the legacy JS (`p.episodes[]`,
`p.lesions[]`, ~700 lines around line 20729) but was later deleted from the UI by a subsequent
patch (`v84-remove-inactive-workflow-pages`) and is unreachable dead code today.

This repository's existing backend (`apps/api`, NestJS + Prisma + PostgreSQL) had the same
architectural problem: `Patient` had direct one-to-many relations to `Diagnosis`, `MdtRecord`,
`ClinicalScore`, `LabPanel`, `ClinicalSnapshot`, `FollowUp`, `ImagingStudy`, and a thin,
unused `TreatmentCourse`/`Procedure` pair was the only nod to episodes (zero API surface).

This ADR records the decisions made to introduce a real `Episode` entity between `Patient`
and all clinically episode-scoped data, and the specific legacy-formula defects that were
preserved (not silently fixed) during the calculation-engine port.

## Decisions

### 1. `Episode` generalizes and replaces `TreatmentCourse`/`Procedure`

`TreatmentCourse` and `Procedure` are dropped entirely. Both had zero API surface and, per
the project's stated assumption, zero real data in any environment. `Episode` (17-status
workflow, `episodeNumber`, `firstOrRepeat`, `previousEpisodeId` self-relation) plus the new
`MappingSession`/`TreatmentSession` models supersede them — these match the legacy app's
actual field taxonomy (mapping and treatment sessions have materially different field sets),
which a single generic `Procedure` model did not.

### 2. `Diagnosis` moves to episode-scoped, 1:1

BCLC/TNM staging is explicitly episode-scoped per the target architecture, and a repeat-SIRT
episode for progressive disease needs its own fresh staging, not an overwrite of the first
episode's. `Diagnosis` is 1:1 per episode (`episodeId String @unique`), not repeatable — an
episode has exactly one diagnosis/staging-of-record. Serial recalculations over time are
`ClinicalScore` rows (see decision 4), which are explicitly kept separate from `Diagnosis`'s
calculated/confirmed pair so a routine lab-driven recalculation can never silently overwrite
a clinician-confirmed stage used for a treatment decision.

### 3. No denormalized `patientId` on episode-scoped models

Every model moved to episode-scope (`Diagnosis`, `MdtRecord`, `ClinicalScore`, `LabPanel`,
`ClinicalSnapshot`, `ImagingStudy`, `FollowUp`) drops its `patientId` FK entirely and reaches
the patient only via `episodeId → Episode.patientId`. A second, denormalized `patientId`
column was considered (cheaper patient-level dashboard queries) and rejected: the entire
point of this rebuild is eliminating the class of drifting-duplicate-field bug the legacy
audit found (e.g. `dapGycm2`/`dapGyCm2`, three independently-writing survival calculators). A
single indexed FK join is cheap in Postgres; a second copy of `patientId` is a new drift
vector for no real gain. If patient-scoped dashboard queries become a bottleneck, a
materialized view is the right fix, not a denormalized FK on every table.

### 4. Calculation provenance: typed columns + a generic audit table, not a generic EAV table

`Diagnosis` (and `DosimetryPlan`) carry explicit `calculatedX`/`confirmedX`/`xOverrideReason`
columns per staging system, mirroring the legacy app's own calculated-vs-confirmed pattern.
A generic `CalculationAudit` table (`entityType, entityId, formulaId, formulaVersion,
inputsSnapshot Json, result Json, status, calculatedAt`) provides full provenance/history. A
fully generic `DerivedValue`-per-field table was considered and rejected: it would force
every consumer (RBAC-gated reads, dashboard filters) into untyped JSON lookups, defeating
Prisma's typed client and class-validator DTOs, for a class of value (current staging state)
that is read far more often than its history is inspected. History, conversely, is
write-once-read-rarely — exactly the opposite tradeoff, and where `CalculationAudit`'s
schema flexibility earns its keep. This mirrors the codebase's existing pattern (typed
columns + a generic `AuditLog` for change history).

### 5. Vocabulary strategy: Prisma enums for small stable sets, table-driven `Vocabulary`/`VocabularyOption` for large/evolving ones

`Role`, `BiologicalSex`, `IdentifierType`, `RecordLockStatus`, `AuditEventType`, `BclcStage`,
`ChildPughGrade`, `EpisodeStatus`, `EpisodeType` stay Prisma enums — these drive workflow/RBAC
`switch` logic where compile-time exhaustiveness matters. Large clinical option sets (tumour
type, aetiology, embolic materials — two distinct lists for mapping vs treatment — the
27-option Michels vascular-anatomy classification, LI-RADS, progression reason, MDT decision,
etc.) are table-driven, seeded verbatim from the legacy app's datalists
(`apps/api/src/vocabularies/seed-data/*.ts`), cached in memory at boot
(`VocabularyCacheService`), and validated via a synchronous `@IsVocabularyCode()`
class-validator decorator. Runtime cache invalidation on vocabulary edits is an explicit,
documented non-goal this phase — there is no admin UI to edit `VocabularyOption` rows yet, so
refresh only happens at boot.

The existing `mdt.dto.ts` hardcoded `MDT_DECISIONS` array was left untouched for scope
discipline (it is working, tested-by-use code); a matching `MDT_DECISION` vocabulary row was
seeded so future modules/reporting have one consistent source to reference. Migrating the MDT
DTOs to `@IsVocabularyCode` is a small, low-risk follow-up, not done here.

### 6. Hard blocks vs override-able warnings

Episode transition readiness findings are split by one principle: **hard-block only where
violating the rule leaves the data model itself incoherent; everything about temporal/process
plausibility is a soft warning**, because a clinical registry must accommodate legitimate
edge cases (urgent pathways, retrospective paper-record catch-up entry) that a hard block
would just make staff work around by lying in a free-text field.

- **Hard block** (`apps/api/src/common/validation/episode-readiness-rules.ts`): a `REPEAT`
  episode with no `previousEpisodeId` (a broken reference chain), and a `→ COMPLETED`
  transition while critical readiness findings (currently: missing diagnosis) are
  unresolved — `COMPLETED` specifically means "finished, reportable."
- **Warning, override-able with a reason ≥ 10 characters** (matching the existing MDT
  `unlock()` reason convention): a `→ MDT_APPROVED` transition with zero recorded MDT
  records for the episode. The `overrideWarnings` mechanism on
  `POST /episodes/:id/transition` is deliberately generic (`{code, reason}[]`) so Phase 2
  modules (mapping/dosimetry/treatment/follow-up cross-field date-order checks called out in
  the master spec) can reuse it without rework.

### 7. `POST /episodes/:id/transition` instead of per-action endpoints

MDT's `submit`/`lock`/`unlock` pattern (one endpoint per named action) works because MDT has
3 states with 3 verbs that map 1:1. Episode's 17-state graph has too many edges for that to
stay maintainable, so a single generic transition endpoint validates the target against
`EPISODE_TRANSITIONS` (`apps/api/src/episodes/episode-status-transitions.ts`) server-side. It
still uses the same idempotent `ActionResponse<T>` pattern as MDT (0-row `updateMany` scoped
to expected from-status + version → re-read → `alreadyInState` if already at the target,
else a real conflict).

### 8. `DEFERRED` is not part of the normal transition graph

Most in-progress statuses can transition to `DEFERRED`, but resuming is a distinct action
(`POST /episodes/:id/resume`) that returns to `deferredFromStatus` (captured at the moment of
deferral) rather than the generic graph — this avoids a combinatorial explosion of
"deferred-from-X" edges for every possible prior state.

## Known legacy calculation defects — preserved, not silently fixed

Per the project's explicit rule against silently changing clinical formulas, the following
are ported byte-for-byte from the legacy JS and flagged here (and in code comments) for
clinical review, rather than corrected:

1. **MELD-Na double sodium-adjustment** (`apps/api/src/calculations/meld.ts`). The legacy
   `calcMELD()` computes MELD-3.0 (which already incorporates sodium via
   `0.82*(137-n) - 0.24*(137-n)*ln(b)`) and then applies the classic 2016 MELD-Na correction
   *on top of* that MELD-3.0 value. This likely double-counts sodium's contribution. Ported
   exactly, with `MELD_NA_FORMULA_VERSION` containing the literal string
   `DOUBLE_SODIUM_ADJUSTMENT_UNVERIFIED` so any consumer of `CalculationAudit` rows can see
   the flag without reading source code.
2. **MELD sex-coefficient default**. `f = sex === 'FEMALE' ? 1.33 : 0` — an unset, unknown,
   `MALE`, or `INDETERMINATE` sex all silently receive the non-female coefficient. Ported
   exactly (see `calculateMeld3`/`calculateMeldNa` doc comments and `meld.spec.ts`'s explicit
   "reproduces the legacy unset-sex-treated-as-male behaviour" test).
3. **MELD-Na uses the raw (unclamped) sodium value**, not the 125–137-clamped value used
   inside the MELD-3.0 formula itself. Ported exactly (see `meld.spec.ts`).
4. **Child-Pugh computable from only 2 of 5 components**. `calculateChildPugh` exposes
   `componentsUsed` specifically so a class computed from partial data is visible to callers
   rather than presented as if fully assessed.
5. **BCLC stage '0' is unreachable dead code**. The legacy `bclcStage2022()` checks the 'A'
   branch before the '0' branch, and every input satisfying the '0' condition
   (`cp==='A' && count===1 && largest<=2 && !pvtt`) also satisfies the immediately preceding
   'A' condition — so stage '0' can never actually be returned by the legacy engine. Ported
   exactly, with an explicit test (`bclc.spec.ts`) asserting stage 'A' (not '0') is returned
   for such inputs, and a doc comment on `calculateBclcStage` explaining why.
6. **HKLC staging and the Milan/UCSF/Metroticket 2.0 transplant-criteria checker are deferred,
   not ported this phase.** Metroticket 2.0's "sum of diameters" is a fabricated heuristic
   (`largest × 1.6` for 2 nodules, `× 2.0` for ≥3) rather than the actual per-lesion diameter
   sum the app separately captures (`lesion1/2/3DiamA/B/CMm`) — this needs clinical
   verification before porting. Milan-eligibility specifically is reproduced internally
   inside `bclc.ts` (as `isMilanEligible`, not exported) only because the BCLC 2022 cascade
   itself depends on it (`tx.milan` in the legacy source) — it is not exposed as a standalone
   transplant-criteria calculation.
7. **Three independently-implemented, mutually-inconsistent legacy OS/PFS survival
   calculators** (different day→month divisors: 30, 30.44, 30.4375; different date-precedence
   rules) are not ported this phase. `EpisodeOutcome.osPfsFormulaVersion` is reserved so the
   single consolidated implementation built in a later phase has a place to record which
   formula version produced a given value.

## Consequences

- Switching episodes now displays genuinely independent data; creating a new episode never
  overwrites a prior one (verified in `episodes.integration.spec.ts`).
- The soft-delete Prisma middleware (`apps/api/src/prisma/prisma.service.ts`) does not
  cascade: soft-deleting an `Episode` does not hide its children (`Lesion`, `MappingSession`,
  etc.) from a direct query scoped to `episodeId`. Service-layer code that queries children
  directly must additionally check the parent isn't deleted. This is a known limitation,
  not fixed this phase.
- `Lesion`/`MappingSession` have schema support but no CRUD API yet; `DosimetryPlan`,
  `TreatmentSession`, `FollowUp`, `ToxicityEvent` are schema-only. All are designed so Phase 2
  is additive (no further migration expected for these models).
