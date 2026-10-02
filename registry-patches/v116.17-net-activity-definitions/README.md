# V116 patch v116.17 — net administered activity definitions (audit finding F13)

**Status: ready for your review. Not a frozen release.** Requires v116.16.

## Decision implemented (registry owner, 2026-10-02)

`deliveredActivity` in V116 is **gross** (before residual). Net administered activity = gross − residual.

| Field | Before (V116.15 / v116.16) | After (v116.17) |
|---|---|---|
| Delivery efficiency | gross ÷ assayed × 100 | **net ÷ gross × 100** |
| Activity / perfused volume | gross ÷ perfused L | **net ÷ perfused L** |
| Activity variance | (gross − planned) ÷ planned × 100 | **(net − planned) ÷ planned × 100** |
| **Planned activity administered (new field)** | — | **net ÷ planned × 100** |
| QA classification | thresholds ≤ 10 % / ≤ 20 % | same thresholds; activity component now net-based |

Worked example (verified in the running application): assayed 3.4, delivered 3.2 (gross), residual 0.2, planned 3.2 GBq, perfused 980 mL → efficiency **93.8 %** (was 94.1 %), planned administered **93.8 %**, variance **−6.3 %** (was 0.0 %), activity/perfused volume **3.06 GBq/L**, QA **Concordant**.

Rules:
- A missing residual is **never** taken as 0: every net-based output stays blank until residual is recorded.
- Residual greater than gross is treated as a data-entry error: outputs stay blank.
- "Planned" keeps V116's existing expression (planned activity, else prescribed activity). Audit F4 is still open; this patch does not change it.
- **Residual is not decay-corrected.** V116 records no residual measurement time, so gross and residual are used as entered. Y-90 loses about 1 % per hour, so a residual measured two hours after the gross value makes efficiency read about 0.1 percentage points high at typical residuals. To correct this, a residual-measurement time field would be needed — your call.
- Not changed: residual fraction (still residual ÷ assayed). Say if you want it as residual ÷ gross, so it complements delivery efficiency to 100 %.

## What the patcher changes in the file

1. Inserts the v116.17 calculation layer immediately after v116.16.
2. Eight exact source edits. Each must match exactly once, or nothing is written:

| ID | Change |
|---|---|
| E1 | Adds the field **Planned Activity Administered (%)** (read-only, Planned-versus-Actual QA section) to the SIRT schema, so it is displayed, queryable in Cohort and exported |
| E2 | Form label: "Delivered Activity — gross, before residual (GBq)" |
| E3–E5 | Calculation-panel formula descriptions now state net-based definitions; adds the new row |
| E6–E7 | Registers the new key as a calculated, read-only value in the v116.15 change detection and the SIRT module |
| E8 | Overview tile caption: "net (delivered − residual) ÷ delivered" |

Like v116.16, it refuses to apply if v116.16 is absent, if v116.17 is already present, or if the source doesn't match V116.15 exactly. If the script is misplaced, it shows a red banner instead of running.

## Applying it

1. Apply v116.16 first (its own `patcher.html`).
2. Open this folder's `patcher.html` and choose the **v116.16-patched** file. It downloads `…_PATCHED_V116_17.html`.
3. Open the result: no red banner. In a test SIRT record, enter delivered 3.2, residual 0.2, planned 3.2 → delivery efficiency 93.8 %, planned administered 93.8 %.

## Existing records (F12 console)

Export a backup, then **in this order**:

```js
await RLH.v11616.scan();  await RLH.v11616.repair({ reviewer: 'Your name', confirm: true });
await RLH.v11617.scan();  // read-only: stored vs new value per field
await RLH.v11617.repair({ reviewer: 'Your name', confirm: true });
```

- `RECALCULATE_NET`: stored value is blank or equals the previous (gross) definition → updated, with a per-field audit entry (before, after, reviewer) and one `SIRT_NET_ACTIVITY_RECALC_V11617` audit event per record.
- `REVIEW_SOURCE_UNKNOWN`: matches neither definition (e.g. imported) → never changed automatically.
- The v116.17 repair refuses to run while v116.16 fabricated values remain.

**Expect values to change:** efficiency drops by roughly the residual fraction, and activity variances shift by about −(residual ÷ planned). QA flags can change. Exports made before and after repair will not match. This is intended.

## Validation performed

| Check | Result |
|---|---|
| Unit tests (`node --test test/patch.test.js`): worked example; residual blank/negative; planned blank; F4 expression kept; QA thresholds; all other outputs identical to v116.16; refusal without v116.16 or when misplaced; frozen object; scan/repair classification, ordering guard, audit, idempotence; patcher embeds current patch and edits and compiles | **11/11 pass** |
| End-to-end in the real V116.15 application (`test/e2e-v116.js`, de-identified build, headless Chromium). Both patchers used as you would; synthetic patient entered **through the SIRT form**; values read back from IndexedDB after autosave | **23/23 pass**: patcher refusals; labels and captions; stored values; new read-only field and panel row; field present in Cohort dictionary; no page errors; no added re-render activity; v116.16-only build keeps gross definitions |
| Not tested | Your live records; the browser inside your Horizon image; XLSX/DOCX export layout of the new field (the field is in the schema that drives them, but the exported file was not opened) |

Testing also exposed a gap in v116.16's repair, now fixed there. A false "Clinically significant variance" on an otherwise complete record should be corrected to its true value (e.g. "Concordant"), not blanked, and the earlier v116.16 scan missed such cases.

## Files

- `rlh-v11617-net-activity-definitions.js` — calculation layer (source of truth)
- `edits.json` — the eight exact source edits
- `patcher.html` — generated by `node build-patcher.js`; do not edit by hand
- `test/patch.test.js`, `test/e2e-v116.js`
