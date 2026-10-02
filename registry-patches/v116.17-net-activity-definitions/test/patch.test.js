'use strict';
// Run: node --test registry-patches/v116.17-net-activity-definitions/test/patch.test.js
// Synthetic data only.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const P16 = path.join(__dirname, '..', '..', 'v116.16-derived-blank-guard');
const { calculateDerived: original } = require(path.join(P16, 'test', 'original-calculateDerived.js'));
const PATCH16 = fs.readFileSync(path.join(P16, 'rlh-v11616-derived-blank-guard.js'), 'utf8');
const PATCH17 = fs.readFileSync(path.join(__dirname, '..', 'rlh-v11617-net-activity-definitions.js'), 'utf8');
const EDITS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'edits.json'), 'utf8'));

function boot({ patients = [], with16 = true, extraNS = {} } = {}) {
  const store = { patients: new Map(patients.map((p) => [p.patientId, structuredClone(p)])), audit: [] };
  const NS = {
    STORES: { patients: 'patients', audit: 'audit' },
    sirtSourceParity: Object.freeze({ calculateDerived: original, validate: () => 'validate-untouched' }),
    isoNow: () => '2026-10-02T12:00:00.000Z',
    buildAuditEvent: async (e) => ({ auditEventId: 'ae-' + store.audit.length, ...e }),
    db: {
      getAll: async (s) => (s === 'patients' ? [...store.patients.values()].map((x) => structuredClone(x)) : store.audit.slice()),
      atomic: async (ops) => { for (const op of ops) op.store === 'patients' ? store.patients.set(op.value.patientId, structuredClone(op.value)) : store.audit.push(structuredClone(op.value)); },
    },
  };
  const errors = [];
  const sandbox = { window: { RLH: NS }, console: { info() {}, table() {}, error: (m) => errors.push(String(m)) }, structuredClone };
  if (with16) vm.runInNewContext(PATCH16, sandbox);
  Object.assign(NS, extraNS);
  vm.runInNewContext(PATCH17, sandbox);
  return { NS, store, errors, calc: (d, pos = []) => NS.sirtSourceParity.calculateDerived(d, pos) };
}
const WORKED = { assayedActivity: '3.4', deliveredActivity: '3.2', residualActivity: '0.2', plannedActivity: '3.2', treatmentPerfusedCBCTVolume: '980', treatmentTumourVolume: '142' };

test('worked example: gross 3.2, residual 0.2, planned 3.2, perfused 980 mL', () => {
  const { calc, NS } = boot();
  const o = calc(WORKED);
  assert.equal(o.deliveryEfficiency, '93.8');                 // 3.0 ÷ 3.2
  assert.equal(o.plannedActivityAdministeredPercent, '93.8'); // 3.0 ÷ 3.2
  assert.equal(o.activityVariancePercent, '-6.3');            // (3.0 − 3.2) ÷ 3.2
  assert.equal(o.activityPerPerfusedLitre, '3.06');           // 3.0 ÷ 0.98
  assert.equal(o.qaClassification, 'Concordant');
  assert.equal(NS.v11617.selfTest(), true);
  // previous (gross) definitions for comparison
  const g = original(WORKED, []);
  assert.equal(g.deliveryEfficiency, '94.1');
  assert.equal(g.activityVariancePercent, '0.0');
});

test('missing residual is never treated as zero', () => {
  const { calc } = boot();
  const o = calc({ ...WORKED, residualActivity: '' });
  for (const k of ['deliveryEfficiency', 'activityPerPerfusedLitre', 'activityVariancePercent', 'plannedActivityAdministeredPercent']) assert.equal(o[k], '', k);
});

test('residual greater than gross (data-entry error) yields blank, not a negative value', () => {
  const { calc } = boot();
  const o = calc({ ...WORKED, residualActivity: '3.5' });
  assert.equal(o.deliveryEfficiency, '');
  assert.equal(o.plannedActivityAdministeredPercent, '');
});

test('planned blank: efficiency still calculated; plan-based values blank', () => {
  const { calc } = boot();
  const o = calc({ ...WORKED, plannedActivity: '' });
  assert.equal(o.deliveryEfficiency, '93.8');
  assert.equal(o.activityVariancePercent, '');
  assert.equal(o.plannedActivityAdministeredPercent, '');
});

test('keeps V116 planned expression (planned, else prescribed) — F4 unchanged', () => {
  const { calc } = boot();
  assert.equal(calc({ ...WORKED, plannedActivity: '', prescribedActivity: '3.0' }).plannedActivityAdministeredPercent, '100.0');
});

test('QA uses net activity variance with original thresholds', () => {
  const { calc } = boot();
  assert.equal(calc({ ...WORKED, residualActivity: '0.5' }).qaClassification, 'Minor variance');          // −15.6 %
  assert.equal(calc({ ...WORKED, residualActivity: '1.0' }).qaClassification, 'Clinically significant variance'); // −31 %
  assert.equal(calc({ deliveredActivity: '3.2', plannedActivity: '3.2' }).qaClassification, '');            // no residual → no activity variance
});

test('all other outputs are identical to v116.16', () => {
  const v16 = boot({ with16: true });
  const only16 = (() => { const NS = { sirtSourceParity: Object.freeze({ calculateDerived: original }) }; vm.runInNewContext(PATCH16, { window: { RLH: NS }, console, structuredClone }); return NS.sirtSourceParity.calculateDerived; })();
  const d = { ...WORKED, postPerfusedVolume: '1010', treatmentPredictedTumourDose: '210', actualTumourMeanDose: '188', calibrationDateTime: '2026-04-12T12:00', treatmentDateTime: '2026-04-14T09:00', activityAtCalibration: '5.0' };
  const pos = [{ activity: '1.6', perfusedVolume: '500', tumourVolume: '70' }];
  const a = v16.calc(d, pos), b = only16(d, pos);
  for (const k of Object.keys(b)) if (!['deliveryEfficiency', 'activityPerPerfusedLitre', 'activityVariancePercent', 'qaClassification'].includes(k)) assert.equal(a[k], b[k], k);
});

test('refuses without v116.16, or when placed after the SIRT module; parity object stays frozen', () => {
  const a = boot({ with16: false });
  assert.equal(a.NS.v11617, undefined);
  assert.match(a.errors[0], /v116\.16/);
  const b = boot({ extraNS: { sirtUI: {} } });
  assert.equal(b.NS.v11617, undefined);
  assert.equal(b.NS.PATCHES.at(-1).applied, false);
  const c = boot();
  assert.equal(Object.isFrozen(c.NS.sirtSourceParity), true);
  assert.equal(c.NS.sirtSourceParity.validate(), 'validate-untouched');
});

function v16Only() {
  const NS = { sirtSourceParity: Object.freeze({ calculateDerived: original }) };
  vm.runInNewContext(PATCH16, { window: { RLH: NS }, console: { info() {}, error() {} }, structuredClone });
  return NS.sirtSourceParity.calculateDerived;
}
const tx = (id, data) => ({ patientId: id, oncologyEpisodes: { o1: { oncologyEpisodeId: 'o1', treatments: [{ treatmentEpisodeId: 'tx-' + id, modality: 'SIRT', data, audit: [], treatmentPositions: [] }] } } });

test('scan/repair: gross-based values recalculated with audit; unknown values left; idempotent', async () => {
  const gross = { ...WORKED, ...v16Only()(WORKED, []) };          // saved under v116.16 (gross definitions)
  const imported = { ...WORKED, deliveryEfficiency: '97.0' };      // matches neither definition
  const { NS, store } = boot({ patients: [tx('P1', gross), tx('P2', imported)] });
  const { summary, rows } = await NS.v11617.scan();
  assert.equal(summary.valuesNeedingReview, 1);
  assert.ok(rows.filter((r) => r.treatmentEpisodeId === 'tx-P1').every((r) => r.classification === 'RECALCULATE_NET'));
  await assert.rejects(NS.v11617.repair({ reviewer: 'Dr Synthetic' }), /confirm/);
  const res = await NS.v11617.repair({ reviewer: 'Dr Synthetic', confirm: true });
  assert.equal(res.recordsUpdated, 2); // P2: plan-based fields are new (blank → value); its deliveryEfficiency is not touched
  const p1 = store.patients.get('P1').oncologyEpisodes.o1.treatments[0];
  assert.equal(p1.data.deliveryEfficiency, '93.8');
  assert.equal(p1.data.plannedActivityAdministeredPercent, '93.8');
  assert.equal(p1.data.deliveredActivity, '3.2');
  assert.ok(p1.audit.every((a) => a.reviewedBy === 'Dr Synthetic'));
  assert.equal(store.patients.get('P2').oncologyEpisodes.o1.treatments[0].data.deliveryEfficiency, '97.0');
  assert.equal((await NS.v11617.repair({ reviewer: 'Dr Synthetic', confirm: true })).recordsUpdated, 0);
});

test('repair refuses while v116.16 fabricated values are outstanding', async () => {
  const fabricated = { assayedActivity: '3.4', treatmentPerfusedCBCTVolume: '980', ...original({ assayedActivity: '3.4', treatmentPerfusedCBCTVolume: '980' }, []) };
  const { NS } = boot({ patients: [tx('P1', fabricated)] });
  await assert.rejects(NS.v11617.repair({ reviewer: 'Dr Synthetic', confirm: true }), /v116\.16 repair first/);
  await NS.v11616.repair({ reviewer: 'Dr Synthetic', confirm: true });
  await NS.v11617.repair({ reviewer: 'Dr Synthetic', confirm: true });
});

test('edits.json is well-formed; patcher.html embeds current patch and edits and compiles', () => {
  const ids = new Set();
  for (const e of EDITS) { assert.ok(e.id && e.from && e.to && e.from !== e.to); assert.ok(!ids.has(e.id)); ids.add(e.id); }
  const html = fs.readFileSync(path.join(__dirname, '..', 'patcher.html'), 'utf8');
  assert.equal(html.match(/<script type="text\/plain" id="patch-src">([\s\S]*?)<\/script>/)[1], PATCH17);
  assert.deepEqual(JSON.parse(html.match(/<script type="application\/json" id="edits-src">([\s\S]*?)<\/script>/)[1]), EDITS);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new vm.Script(scripts[0]));
});
