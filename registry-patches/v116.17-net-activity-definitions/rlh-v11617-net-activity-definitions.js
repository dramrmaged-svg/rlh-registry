(()=>{ 'use strict';
/*
 * RLH IR Oncology System — patch v116.17 "net-activity-definitions" (audit finding F13)
 *
 * Registry owner decision (2026-10-02): V116 "deliveredActivity" is GROSS (before residual).
 * Net administered activity = delivered (gross) − residual. Definitions adopted:
 *   deliveryEfficiency                  = net ÷ gross × 100            (was gross ÷ assayed)
 *   activityPerPerfusedLitre            = net ÷ perfused volume (L)    (was gross)
 *   activityVariancePercent             = (net − planned) ÷ planned × 100 (was gross)
 *   plannedActivityAdministeredPercent  = net ÷ planned × 100          (NEW)
 *   qaClassification                    = original thresholds, activity variance now net-based
 * "planned" keeps V116's existing expression (plannedActivity, else prescribedActivity) — audit F4 is
 * still open and deliberately not changed here.
 * Residual is not decay-corrected: V116 records no residual measurement time.
 * Net < 0 (residual > gross) is a data-entry error: outputs stay blank.
 *
 * REQUIRES v116.16 and must sit immediately after it (patcher.html does this, together with the
 * label and schema edits listed in README). Refuses with a visible banner otherwise.
 *
 * Existing records:
 *   RLH.v11617.scan()                                     read-only before/after report
 *   RLH.v11617.repair({ reviewer: 'Name', confirm: true }) recalculates, with audit
 */
const NS = window.RLH;
if (!NS || window.__RLH_V11617_NET_ACTIVITY__) return;
window.__RLH_V11617_NET_ACTIVITY__ = true;
const VERSION = '0.8.5-m8.5-v116.17-net-activity-definitions';
NS.PATCHES = Array.isArray(NS.PATCHES) ? NS.PATCHES : [];

function notApplied(reason) {
  NS.PATCHES.push({ version: VERSION, finding: 'F13', applied: false, reason });
  console.error('[v116.17] PATCH NOT APPLIED: ' + reason);
  const show = () => {
    if (typeof document === 'undefined' || !document.body) return;
    const b = document.createElement('div');
    b.setAttribute('role', 'alert');
    b.style.cssText = 'position:fixed;left:0;right:0;top:36px;z-index:2147483647;background:#b5261a;color:#fff;font:600 14px/1.4 system-ui,sans-serif;padding:8px 14px';
    b.textContent = 'v116.17 net-activity definitions NOT applied: ' + reason + ' Delivery figures on screen use the old (gross) definitions.';
    document.body.appendChild(b);
  };
  if (typeof document !== 'undefined') document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', show) : show();
}
const prev = NS.sirtSourceParity;
if (NS.sirtUI) { notApplied('patch script is placed after the SIRT module.'); return; }
if (!NS.PATCHES.some((p) => /v116\.16/.test(p.version) && p.applied)) { notApplied('v116.16 (derived-calculation blank guard) is not active; it is required first.'); return; }
if (!prev || typeof prev.calculateDerived !== 'function') { notApplied('RLH.sirtSourceParity.calculateDerived not found.'); return; }
const previous = prev.calculateDerived; // the v116.16-guarded engine

const value = (v) => {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const x = parseFloat(v);
  return Number.isFinite(x) ? x : null;
};
const netActivity = (d) => {
  const gross = value(d.deliveredActivity), residual = value(d.residualActivity);
  if (gross === null || residual === null) return null;
  const n = gross - residual;
  return n >= 0 ? n : null;
};
const plannedActivity = (d) => value(d.plannedActivity || d.prescribedActivity);
const variance = (actual, planned) => (actual !== null && planned !== null && planned > 0 ? ((actual - planned) / planned) * 100 : null);
const NEW_KEYS = ['deliveryEfficiency', 'activityPerPerfusedLitre', 'activityVariancePercent', 'plannedActivityAdministeredPercent', 'qaClassification'];

function netDerived(d, positions = []) {
  d = d || {};
  const out = previous(d, positions);
  const gross = value(d.deliveredActivity), net = netActivity(d), planned = plannedActivity(d), perfused = value(d.treatmentPerfusedCBCTVolume);
  out.deliveryEfficiency = net !== null && gross > 0 ? ((net / gross) * 100).toFixed(1) : '';
  out.activityPerPerfusedLitre = net !== null && perfused !== null && perfused > 0 ? (net / (perfused / 1000)).toFixed(2) : '';
  const av = variance(net, planned);
  out.activityVariancePercent = av === null ? '' : av.toFixed(1);
  out.plannedActivityAdministeredPercent = net !== null && planned !== null && planned > 0 ? ((net / planned) * 100).toFixed(1) : '';
  const vals = [
    av,
    variance(value(d.postPerfusedVolume), value(d.treatmentPerfusedCBCTVolume)),
    variance(value(d.actualTumourMeanDose || d.deliveredTumourDose), value(d.treatmentPredictedTumourDose)),
    variance(value(d.actualNormalLiverMeanDose || d.deliveredNormalLiverDose), value(d.treatmentPredictedNormalLiverDose)),
  ].filter((x) => x !== null).map(Math.abs);
  out.qaClassification = vals.length
    ? (Math.max(...vals) <= 10 ? 'Concordant' : Math.max(...vals) <= 20 ? 'Minor variance' : 'Clinically significant variance')
    : '';
  return out;
}

NS.sirtSourceParity = Object.freeze({ ...prev, calculateDerived: netDerived });

// ---------- Existing records ----------
const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';
const clone = (x) => structuredClone(x);
function sirtRecords(patients) {
  const rows = [];
  for (const p of patients || []) for (const onc of Object.values(p?.oncologyEpisodes || {})) for (const r of onc?.treatments || []) if (r?.modality === 'SIRT' && r.data) rows.push({ p, onc, r });
  return rows;
}
/**
 * RECALCULATE_NET: stored value is blank or equals the previous (gross) definition for this record's
 *   current inputs → safe to replace with the net-based value.
 * REVIEW_SOURCE_UNKNOWN: stored value matches neither definition (e.g. imported). Never changed automatically.
 */
function findings(p, onc, r) {
  const d = r.data, positions = r.treatmentPositions || [];
  const before = previous(d, positions), after = netDerived(d, positions);
  const out = [];
  for (const key of NEW_KEYS) {
    const stored = isBlank(d[key]) ? '' : String(d[key]);
    const next = String(after[key] ?? '');
    if (stored === next) continue;
    out.push({
      patientId: p.patientId, oncologyEpisodeId: onc.oncologyEpisodeId, treatmentEpisodeId: r.treatmentEpisodeId,
      field: key, storedValue: stored, newValue: next,
      classification: stored === '' || stored === String(before[key] ?? '') ? 'RECALCULATE_NET' : 'REVIEW_SOURCE_UNKNOWN',
    });
  }
  return out;
}
async function scan() {
  const patients = await NS.db.getAll(NS.STORES.patients);
  const recs = sirtRecords(patients);
  const rows = recs.flatMap(({ p, onc, r }) => findings(p, onc, r));
  const v16 = NS.v11616 ? (await NS.v11616.scan()).summary.fabricatedValues : null;
  const summary = {
    patchVersion: VERSION, sirtRecordsScanned: recs.length,
    recordsAffected: new Set(rows.map((x) => x.treatmentEpisodeId)).size,
    valuesToRecalculate: rows.filter((x) => x.classification === 'RECALCULATE_NET').length,
    valuesNeedingReview: rows.filter((x) => x.classification === 'REVIEW_SOURCE_UNKNOWN').length,
    v11616FabricatedValuesOutstanding: v16,
  };
  if (typeof console.table === 'function' && rows.length) console.table(rows);
  console.info('[v116.17] scan', summary);
  return { summary, rows };
}
async function repair({ reviewer, confirm } = {}) {
  if (confirm !== true) throw new Error('Repair not run: pass confirm: true after reviewing scan() output and exporting a backup.');
  if (!reviewer || String(reviewer).trim().length < 3) throw new Error('Repair not run: reviewer name is required.');
  if (NS.v11616 && (await NS.v11616.scan()).summary.fabricatedValues > 0) throw new Error('Repair not run: run the v116.16 repair first (fabricated values still present).');
  reviewer = String(reviewer).trim();
  const at = NS.isoNow ? NS.isoNow() : new Date().toISOString();
  let recordsUpdated = 0, valuesUpdated = 0;
  for (const stored of await NS.db.getAll(NS.STORES.patients)) {
    const p = clone(stored), ops = [];
    for (const { onc, r } of sirtRecords([p])) {
      const todo = findings(p, onc, r).filter((x) => x.classification === 'RECALCULATE_NET');
      if (!todo.length) continue;
      const before = clone(r);
      r.audit = Array.isArray(r.audit) ? r.audit : [];
      for (const f of todo) {
        r.data[f.field] = f.newValue;
        r.audit.push({ timestamp: at, action: 'V116_17_NET_ACTIVITY_RECALC', fieldKey: f.field, before: f.storedValue, after: f.newValue, reviewedBy: reviewer, patchVersion: VERSION });
        valuesUpdated++;
      }
      r.updatedAt = at;
      recordsUpdated++;
      ops.push({ type: 'put', store: NS.STORES.audit, value: await NS.buildAuditEvent({
        action: 'SIRT_NET_ACTIVITY_RECALC_V11617', entityType: 'TreatmentEpisode', entityId: r.treatmentEpisodeId, before, after: clone(r),
        details: { patientId: p.patientId, oncologyEpisodeId: onc.oncologyEpisodeId, modality: 'SIRT', reviewer, patchVersion: VERSION, fieldsUpdated: todo.map((x) => x.field) },
      }) });
    }
    if (ops.length) { p.updatedAt = at; await NS.db.atomic([{ type: 'put', store: NS.STORES.patients, value: p }, ...ops]); }
  }
  const result = { patchVersion: VERSION, reviewer, recordsUpdated, valuesUpdated };
  console.info('[v116.17] repair', result, '— reload the page before further editing.');
  return result;
}
function selfTest() {
  const o = netDerived({ assayedActivity: '3.4', deliveredActivity: '3.2', residualActivity: '0.2', plannedActivity: '3.2', treatmentPerfusedCBCTVolume: '980' }, []);
  const ok = o.deliveryEfficiency === '93.8' && o.plannedActivityAdministeredPercent === '93.8' && o.activityVariancePercent === '-6.3' && o.activityPerPerfusedLitre === '3.06'
    && netDerived({ deliveredActivity: '3.2', plannedActivity: '3.2' }, []).deliveryEfficiency === '';
  if (!ok) console.error('[v116.17] SELF-TEST FAILED', o);
  return ok;
}
NS.v11617 = Object.freeze({ version: VERSION, keys: NEW_KEYS.slice(), scan, repair, selfTest });
NS.PATCHES.push({ version: VERSION, finding: 'F13', applied: true, selfTest: selfTest() });
})();
