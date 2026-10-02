# V116 patch v116.16 — derived-calculation blank guard (audit finding F1)

**Status: ready for your review. Not a frozen release.** You decide whether to adopt it and how to label the release.

## The defect

V116's SIRT derived-calculation engine (frozen from v113.6) reads every blank input as **0**, and the SIRT module **saves** the results into the record on autosave. Reproduced in the real application (headless Chromium, data-free build):

| Inputs entered | Stored by V116.15 | Stored with v116.16 |
|---|---|---|
| Assayed 3.4 GBq, treatment perfused 980 mL only | delivery efficiency **0.0 %**, residual **0.0 %**, tumour burden **0.0 %**, normal-liver volume **980.0 mL**, activity/perfused litre **0.00**, perfused-volume variance **−100 %**, QA **"Clinically significant variance"**, position totals **0** | all blank |
| Complete treatment data (assayed, delivered, residual, planned, perfused, tumour) — **post-treatment scan not yet entered** | perfused-volume variance **−100 %**, QA **"Clinically significant variance"** | variance blank, QA **"Concordant"** |
| All inputs present | unchanged | **identical** (2,000 random cases checked) |

**Who is affected:** in practice, every SIRT record saved before its post-treatment perfused volume (or any other input) was entered. Expect a false "Clinically significant variance" on most records between treatment and post-treatment imaging, and "0.0" values on incomplete records. These values are in the IndexedDB records and in anything exported from them.

## What the patch does — and does not do

- Calls the **original** engine unchanged, then blanks any output whose own required inputs are blank. QA classification is recomputed from documented variances only, using the original thresholds (≤ 10 % concordant, ≤ 20 % minor).
- Position totals are blank unless every position documents that value (a partial sum would understate).
- **Not changed** (each needs a clinical decision first): A/T ratio source fallbacks (F3), planned ← prescribed fallback (F4), dose-engine TNR/LSF defaults (F2), residual subtraction (F5).
- No schema change, no change to any form field, report text or other module.
- Placement-safe: if it is put anywhere other than immediately after the engine block, it does nothing and shows a **red banner** saying the fix is not active.

## Applying it (no installation needed)

1. Keep your current V116.15 file unchanged as the rollback copy.
2. Open `patcher.html` in the browser (double-click). Choose your V116.15 file. It downloads `…_PATCHED_V116_16.html` and shows the SHA-256 of input and output. The file is processed locally and never uploaded.
3. Open the patched file. Go to the SIRT module. **There must be no red banner.**
4. Quick check in a test record: enter only *assayed activity*. The overview "Delivery efficiency" tile must show **—**, not 0.0 %.

`patcher.html` refuses files that are already patched, or that are not V116.15. It does **not** remove the embedded patient data block (audit F0); it warns you if it is present.

## Checking and repairing existing records

This needs the browser's developer console (F12 → Console). If F12 is blocked inside Horizon, tell me and I will add a button.

1. **Export a JSON backup first** (V116's export function).
2. Run the read-only scan:
   ```js
   await RLH.v11616.scan()
   ```
   It lists, per SIRT treatment episode (internal IDs only, no names), each affected field:
   - `FABRICATED_BY_V116_BUG` — the stored value is exactly what the old engine produces from this record's inputs, and differs from the correct value. The correct value is shown (`correctedValue`): blank where inputs are missing, or the true value — typically QA "Concordant" instead of a false "Clinically significant variance" caused by a not-yet-entered post-treatment volume.
   - `REVIEW_SOURCE_UNKNOWN` — a value is stored that neither engine produces (e.g. imported from v113/Excel). **Never changed automatically**; review by hand.
3. When you are satisfied, correct the fabricated values only:
   ```js
   await RLH.v11616.repair({ reviewer: 'Your name', confirm: true })
   ```
   Each repaired record gets a per-field entry in its own `audit[]` (before value, corrected value, reviewer) and one `SIRT_DERIVED_BLANK_REPAIR_V11616` audit event with before/after snapshots. Source inputs are never touched. Running it again does nothing.
4. Reload the page before editing further.

Rollback: re-open the original file. Repaired values can be restored from the audit entries if ever needed.

## Validation performed

| Check | Result |
|---|---|
| Unit tests (`node --test test/patch.test.js`) against a verbatim copy of the original engine: bug reproduced; blanks guarded; all-inputs-present outputs byte-identical (fixed case + 2,000 random cases); frozen object handled; misplacement refused; scan/repair classification, audit, idempotence; false QA flag on a complete record corrected to its true value; patcher embeds current patch and compiles | **16/16 pass** |
| End-to-end in the real V116.15 application (headless Chromium, build with the embedded patient-data block removed; `test/e2e-v116.js`): patch via `patcher.html`; SIRT autosave code path; scan/repair on a synthetic record; misplaced build | **pass** — patched: no page errors, fix active, no banner; misplaced: banner shown, engine untouched; re-patch refused |
| Not tested | A live IndexedDB containing your real records; Edge/Chrome versions inside your Horizon image; whether F12 is available there |

The end-to-end run caught a defect the unit tests could not: V116 freezes the engine object, so the first version of this patch silently failed to apply. The patch now replaces the frozen object at load time, before the SIRT module captures it, and the placement banner exists because of that finding.

## Revision note

2026-10-02 (before adoption): the repair originally only blanked fabricated values. It now restores the correct value, which may be non-blank. The first version would have missed the most common case: a false "Clinically significant variance" on complete records awaiting post-treatment imaging. Found while testing v116.17.

## Related finding (not fixed here)

**F12 (minor):** a v116.14 boot step resets `RLH.VERSION`, the page title and the version meta tag to "v116.14" after load, so V116.15 identifies itself as v116.14. Audit events stamp `RLH.VERSION`, so they likely record v116.14. Fix this when you label the next frozen release. Whether v116.16 is active is recorded in `RLH.PATCHES` and in the repair audit events.

## Files

- `rlh-v11616-derived-blank-guard.js` — the patch (source of truth)
- `patcher.html` — generated by `node build-patcher.js`; do not edit by hand
- `test/patch.test.js` — unit tests; `test/original-calculateDerived.js` — verbatim copy of the V116 engine function (no patient data)
- `test/e2e-v116.js` — browser end-to-end test; refuses inputs that contain embedded patient identifiers
