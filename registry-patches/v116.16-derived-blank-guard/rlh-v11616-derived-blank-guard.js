(()=>{ 'use strict';
/*
 * RLH IR Oncology System — patch v116.16 "derived-blank-guard"
 *
 * Fixes audit finding F1 (docs/extractor/02_v116_registry_audit.md):
 * NS.sirtSourceParity.calculateDerived treats blank inputs as 0, and the SIRT
 * module persists its output into the record on autosave. An incomplete case
 * therefore stored e.g. deliveryEfficiency "0.0", calculatedNormalLiverVolume
 * equal to the whole perfused volume, and qaClassification
 * "Clinically significant variance".
 *
 * Placement: immediately AFTER the script block ending "NS.sirtSourceParity=Object.freeze({...})" and
 * BEFORE the SIRT module. Use patcher.html, which inserts it at the right place and checks.
 *
 * Approach (minimal): the original function is still called and its formulas
 * are unchanged. This layer blanks any output whose required inputs are blank,
 * and recomputes qaClassification from the surviving variances only.
 * Outputs whose inputs are all documented are returned exactly as before.
 *
 * Not changed here (need a clinical decision, see audit F2–F5): A/T ratio
 * source fallbacks, planned ← prescribed fallback, dose-engine defaults.
 *
 * Also provides, for records saved before this patch:
 *   RLH.v11616.scan()                                   read-only report
 *   RLH.v11616.repair({ reviewer: 'Name', confirm: true }) clears values the
 *     old engine fabricated from blank inputs, with an audit event per record.
 */
const NS = window.RLH;
if (!NS || window.__RLH_V11616_DERIVED_BLANK_GUARD__) return;
window.__RLH_V11616_DERIVED_BLANK_GUARD__ = true;
const VERSION = '0.8.5-m8.5-v116.16-derived-blank-guard';
NS.PATCHES = Array.isArray(NS.PATCHES) ? NS.PATCHES : [];

// The SIRT module (block 17) captures NS.sirtSourceParity once when it loads, and the object is frozen.
// This patch must therefore run AFTER block 15 (which defines it) and BEFORE block 17. If it is placed
// anywhere else it refuses to run and shows a visible banner, so a misplaced patch can never fail silently.
function notApplied(reason) {
  NS.PATCHES.push({ version: VERSION, finding: 'F1', applied: false, reason });
  console.error('[v116.16] PATCH NOT APPLIED: ' + reason);
  const show = () => {
    if (typeof document === 'undefined' || !document.body) return;
    const b = document.createElement('div');
    b.setAttribute('role', 'alert');
    b.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:2147483647;background:#b5261a;color:#fff;font:600 14px/1.4 system-ui,sans-serif;padding:8px 14px';
    b.textContent = 'v116.16 derived-calculation fix NOT applied: ' + reason + ' Do not use this build for SIRT data entry.';
    document.body.appendChild(b);
  };
  if (typeof document !== 'undefined') document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', show) : show();
}
const prev = NS.sirtSourceParity;
if (NS.sirtUI) { notApplied('patch script is placed after the SIRT module; it must sit immediately after the block that defines RLH.sirtSourceParity.'); return; }
if (!prev || typeof prev.calculateDerived !== 'function') { notApplied('RLH.sirtSourceParity.calculateDerived not found (patch placed too early or wrong base version).'); return; }
const original = prev.calculateDerived;

// Same parsing as the original engine (parseFloat), except blank/non-numeric is "absent", never 0.
const value = (v) => {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const x = parseFloat(v);
  return Number.isFinite(x) ? x : null;
};
const has = (v) => value(v) !== null;

// Output key → raw inputs that must all be documented. Fallbacks (a || b) mirror the original engine exactly.
const REQUIRES = {
  deliveryEfficiency: (d) => [d.assayedActivity, d.deliveredActivity],
  residualFraction: (d) => [d.assayedActivity, d.residualActivity],
  tumourBurdenPercent: (d) => [d.treatmentPerfusedCBCTVolume, d.treatmentTumourVolume],
  calculatedNormalLiverVolume: (d) => [d.treatmentPerfusedCBCTVolume, d.treatmentTumourVolume],
  activityPerPerfusedLitre: (d) => [d.treatmentPerfusedCBCTVolume, d.deliveredActivity],
  activityVariancePercent: (d) => [d.deliveredActivity, d.plannedActivity || d.prescribedActivity],
  perfusedVolumeVariancePercent: (d) => [d.postPerfusedVolume, d.treatmentPerfusedCBCTVolume],
  tumourDoseVariancePercent: (d) => [d.actualTumourMeanDose || d.deliveredTumourDose, d.treatmentPredictedTumourDose],
  normalLiverDoseVariancePercent: (d) => [d.actualNormalLiverMeanDose || d.deliveredNormalLiverDose, d.treatmentPredictedNormalLiverDose],
};
const VARIANCE_INPUTS = [
  (d) => [d.deliveredActivity, d.plannedActivity || d.prescribedActivity],
  (d) => [d.postPerfusedVolume, d.treatmentPerfusedCBCTVolume],
  (d) => [d.actualTumourMeanDose || d.deliveredTumourDose, d.treatmentPredictedTumourDose],
  (d) => [d.actualNormalLiverMeanDose || d.deliveredNormalLiverDose, d.treatmentPredictedNormalLiverDose],
];
const POSITION_TOTALS = { positionsTotalActivity: 'activity', positionsTotalPerfused: 'perfusedVolume', positionsTotalTumour: 'tumourVolume' };
const GUARDED_KEYS = [...Object.keys(REQUIRES), 'qaClassification', ...Object.keys(POSITION_TOTALS)];

function guardedCalculateDerived(d, positions = []) {
  d = d || {};
  positions = Array.isArray(positions) ? positions : [];
  const out = original(d, positions);
  for (const [key, inputs] of Object.entries(REQUIRES)) {
    if (!inputs(d).every(has)) out[key] = '';
  }
  // qaClassification: same thresholds as the original, using only variances whose inputs are both documented
  // (unrounded, as the original does) — a blank actual no longer counts as a −100% variance.
  const vals = [];
  for (const inputs of VARIANCE_INPUTS) {
    const [actual, planned] = inputs(d).map(value);
    if (actual !== null && planned !== null && planned > 0) vals.push(Math.abs(((actual - planned) / planned) * 100));
  }
  out.qaClassification = vals.length
    ? (Math.max(...vals) <= 10 ? 'Concordant' : Math.max(...vals) <= 20 ? 'Minor variance' : 'Clinically significant variance')
    : '';
  // Position totals: blank unless every position documents that column (a partial sum would understate the total).
  for (const [key, col] of Object.entries(POSITION_TOTALS)) {
    if (!positions.length || !positions.every((p) => has(p && p[col]))) out[key] = '';
  }
  return out;
}

NS.sirtSourceParity = Object.freeze({ ...prev, calculateDerived: guardedCalculateDerived });

// ---------- Existing records: read-only scan and explicit repair ----------
const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';
const clone = (x) => structuredClone(x);

function sirtRecords(patients) {
  const rows = [];
  for (const p of patients || []) {
    for (const onc of Object.values(p?.oncologyEpisodes || {})) {
      for (const r of onc?.treatments || []) {
        if (r?.modality === 'SIRT' && r.data) rows.push({ p, onc, r });
      }
    }
  }
  return rows;
}

/**
 * FABRICATED_BY_V116_BUG: stored value equals what the pre-patch engine produces from this record's
 *   current inputs, and the required inputs are blank → the value was invented from blanks.
 * REVIEW_SOURCE_UNKNOWN: a value is stored, inputs are blank, but it does not match the pre-patch engine
 *   (e.g. imported from v113/Excel). Never changed automatically.
 */
function findings(p, onc, r) {
  const d = r.data, positions = r.treatmentPositions || [];
  const before = original(d, positions), after = guardedCalculateDerived(d, positions);
  const out = [];
  for (const key of GUARDED_KEYS) {
    if (after[key] !== '' || isBlank(d[key])) continue;
    out.push({
      patientId: p.patientId,
      oncologyEpisodeId: onc.oncologyEpisodeId,
      treatmentEpisodeId: r.treatmentEpisodeId,
      field: key,
      storedValue: String(d[key]),
      classification: String(d[key]) === String(before[key] ?? '') ? 'FABRICATED_BY_V116_BUG' : 'REVIEW_SOURCE_UNKNOWN',
    });
  }
  return out;
}

async function scan() {
  const patients = await NS.db.getAll(NS.STORES.patients);
  const rows = sirtRecords(patients).flatMap(({ p, onc, r }) => findings(p, onc, r));
  const summary = {
    patchVersion: VERSION,
    sirtRecordsScanned: sirtRecords(patients).length,
    recordsAffected: new Set(rows.map((x) => x.treatmentEpisodeId)).size,
    fabricatedValues: rows.filter((x) => x.classification === 'FABRICATED_BY_V116_BUG').length,
    valuesNeedingReview: rows.filter((x) => x.classification === 'REVIEW_SOURCE_UNKNOWN').length,
  };
  if (typeof console.table === 'function' && rows.length) console.table(rows);
  console.info('[v116.16] scan', summary);
  return { summary, rows };
}

async function repair({ reviewer, confirm } = {}) {
  if (confirm !== true) throw new Error('Repair not run: pass confirm: true after reviewing scan() output and exporting a backup.');
  if (!reviewer || String(reviewer).trim().length < 3) throw new Error('Repair not run: reviewer name is required.');
  reviewer = String(reviewer).trim();
  const at = NS.isoNow ? NS.isoNow() : new Date().toISOString();
  const patients = await NS.db.getAll(NS.STORES.patients);
  let recordsRepaired = 0, valuesCleared = 0;
  for (const original_p of patients) {
    const p = clone(original_p);
    const ops = [];
    for (const { onc, r } of sirtRecords([p])) {
      const fabricated = findings(p, onc, r).filter((x) => x.classification === 'FABRICATED_BY_V116_BUG');
      if (!fabricated.length) continue;
      const before = clone(r);
      r.audit = Array.isArray(r.audit) ? r.audit : [];
      for (const f of fabricated) {
        r.data[f.field] = '';
        r.audit.push({ timestamp: at, action: 'V116_16_DERIVED_BLANK_REPAIR', fieldKey: f.field, before: f.storedValue, after: '', reviewedBy: reviewer, patchVersion: VERSION });
        valuesCleared++;
      }
      r.updatedAt = at;
      recordsRepaired++;
      ops.push({
        type: 'put',
        store: NS.STORES.audit,
        value: await NS.buildAuditEvent({
          action: 'SIRT_DERIVED_BLANK_REPAIR_V11616',
          entityType: 'TreatmentEpisode',
          entityId: r.treatmentEpisodeId,
          before,
          after: clone(r),
          details: { patientId: p.patientId, oncologyEpisodeId: onc.oncologyEpisodeId, modality: 'SIRT', reviewer, patchVersion: VERSION, fieldsCleared: fabricated.map((x) => x.field) },
        }),
      });
    }
    if (ops.length) {
      p.updatedAt = at;
      await NS.db.atomic([{ type: 'put', store: NS.STORES.patients, value: p }, ...ops]);
    }
  }
  const result = { patchVersion: VERSION, reviewer, recordsRepaired, valuesCleared };
  console.info('[v116.16] repair', result, '— reload the page before further editing.');
  return result;
}

function selfTest() {
  const t = guardedCalculateDerived({ assayedActivity: '3.4', treatmentPerfusedCBCTVolume: '980' }, []);
  const ok = ['deliveryEfficiency', 'residualFraction', 'tumourBurdenPercent', 'calculatedNormalLiverVolume', 'activityPerPerfusedLitre', 'perfusedVolumeVariancePercent', 'qaClassification', 'positionsTotalActivity']
    .every((k) => t[k] === '');
  if (!ok) console.error('[v116.16] SELF-TEST FAILED', t);
  return ok;
}

NS.v11616 = Object.freeze({ version: VERSION, guardedKeys: GUARDED_KEYS.slice(), scan, repair, selfTest });
NS.PATCHES.push({ version: VERSION, finding: 'F1', applied: true, selfTest: selfTest() });
// NS.VERSION / page title are deliberately left to the release owner (a later v116.14 boot step resets them anyway —
// audit F12). Whether this patch is active is recorded in RLH.PATCHES and in every repair audit event.
})();
