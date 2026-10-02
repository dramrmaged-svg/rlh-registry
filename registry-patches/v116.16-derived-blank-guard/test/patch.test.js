'use strict';
// Run: node --test registry-patches/v116.16-derived-blank-guard/test
// Synthetic data only. No V116 patient data is used or needed.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { calculateDerived: original } = require('./original-calculateDerived.js');

const PATCH = fs.readFileSync(path.join(__dirname, '..', 'rlh-v11616-derived-blank-guard.js'), 'utf8');

function boot(patients = [], extraNS = {}) {
  const store = { patients: new Map(patients.map((p) => [p.patientId, structuredClone(p)])), audit: [] };
  const NS = {
    VERSION: '0.8.5-m8.5-v116.15-sirt-field-harmonisation',
    STORES: { patients: 'patients', audit: 'audit' },
    sirtSourceParity: Object.freeze({ calculateDerived: original, validate: () => 'validate-untouched' }), // frozen, as in V116
    isoNow: () => '2026-10-02T12:00:00.000Z',
    uuid: () => 'audit-' + Math.random().toString(16).slice(2),
    buildAuditEvent: async (e) => ({ auditEventId: 'ae-' + store.audit.length, ...e }),
    db: {
      getAll: async (s) => (s === 'patients' ? [...store.patients.values()].map((x) => structuredClone(x)) : store.audit.slice()),
      atomic: async (ops) => {
        for (const op of ops) {
          if (op.store === 'patients') store.patients.set(op.value.patientId, structuredClone(op.value));
          else store.audit.push(structuredClone(op.value));
        }
      },
    },
  };
  Object.assign(NS, extraNS);
  const sandbox = { window: { RLH: NS }, console: { info() {}, table() {}, error: console.error }, structuredClone };
  vm.runInNewContext(PATCH, sandbox);
  return { NS, store };
}

const KEYS = ['deliveryEfficiency', 'residualFraction', 'tumourBurdenPercent', 'calculatedNormalLiverVolume', 'activityPerPerfusedLitre',
  'activityVariancePercent', 'perfusedVolumeVariancePercent', 'tumourDoseVariancePercent', 'normalLiverDoseVariancePercent', 'qaClassification',
  'positionsTotalActivity', 'positionsTotalPerfused', 'positionsTotalTumour'];

test('reproduces the bug in the original engine (guards the test itself)', () => {
  const o = original({ assayedActivity: '3.4', treatmentPerfusedCBCTVolume: '980' }, []);
  assert.equal(o.deliveryEfficiency, '0.0');
  assert.equal(o.calculatedNormalLiverVolume, '980.0');
  assert.equal(o.qaClassification, 'Clinically significant variance');
});

test('blank inputs no longer produce values', () => {
  const { NS } = boot();
  const o = NS.sirtSourceParity.calculateDerived({ assayedActivity: '3.4', treatmentPerfusedCBCTVolume: '980' }, []);
  for (const k of KEYS) assert.equal(o[k], '', k);
  assert.equal(NS.v11616.selfTest(), true);
  assert.equal(NS.PATCHES.at(-1).version, '0.8.5-m8.5-v116.16-derived-blank-guard');
});

test('calculations with all inputs documented are byte-identical to the original', () => {
  const { NS } = boot();
  const d = {
    assayedActivity: '3.4', deliveredActivity: '3.1', residualActivity: '0.3', plannedActivity: '3.2',
    treatmentPerfusedCBCTVolume: '980', treatmentTumourVolume: '142', postPerfusedVolume: '1010',
    treatmentPredictedTumourDose: '210', actualTumourMeanDose: '188', treatmentPredictedNormalLiverDose: '38', actualNormalLiverMeanDose: '41',
    perfusedCBCTVolume: '980', tumourVolume: '140', maaPerfusedVolume: '950', maaTumourVolume: '150',
    calibrationDateTime: '2026-04-12T12:00', treatmentDateTime: '2026-04-14T09:00', activityAtCalibration: '5.0',
  };
  const pos = [{ activity: '1.6', perfusedVolume: '500', tumourVolume: '70' }, { activity: '1.5', perfusedVolume: '480', tumourVolume: '72' }];
  assert.deepEqual(NS.sirtSourceParity.calculateDerived(d, pos), original(d, pos));
});

test('property: for random fully-documented inputs the guard never changes any output', () => {
  const { NS } = boot();
  const fields = ['assayedActivity', 'deliveredActivity', 'residualActivity', 'plannedActivity', 'treatmentPerfusedCBCTVolume', 'treatmentTumourVolume',
    'postPerfusedVolume', 'treatmentPredictedTumourDose', 'actualTumourMeanDose', 'treatmentPredictedNormalLiverDose', 'actualNormalLiverMeanDose'];
  let seed = 42;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let i = 0; i < 2000; i++) {
    const d = Object.fromEntries(fields.map((f) => [f, (0.05 + rnd() * 1500).toFixed(2)]));
    const pos = Array.from({ length: Math.floor(rnd() * 4) + 1 }, () => ({ activity: (rnd() * 3).toFixed(2), perfusedVolume: (rnd() * 900).toFixed(0), tumourVolume: (rnd() * 200).toFixed(0) }));
    assert.deepEqual(NS.sirtSourceParity.calculateDerived(d, pos), original(d, pos), `case ${i}`);
  }
});

test('each output is blanked only when one of its own inputs is missing', () => {
  const { NS } = boot();
  const full = { assayedActivity: '3.4', deliveredActivity: '3.1', residualActivity: '0.3', treatmentPerfusedCBCTVolume: '980', treatmentTumourVolume: '142' };
  const o = NS.sirtSourceParity.calculateDerived({ ...full, residualActivity: '' }, []);
  assert.equal(o.residualFraction, '');
  assert.equal(o.deliveryEfficiency, original(full, []).deliveryEfficiency);
  assert.equal(o.tumourBurdenPercent, original(full, []).tumourBurdenPercent);
});

test('qaClassification uses only documented variances; a blank actual is not a −100% variance', () => {
  const { NS } = boot();
  const d = { deliveredActivity: '3.1', plannedActivity: '3.2', treatmentPerfusedCBCTVolume: '980', treatmentPredictedTumourDose: '210' };
  assert.equal(original(d, []).qaClassification, 'Clinically significant variance');
  assert.equal(NS.sirtSourceParity.calculateDerived(d, []).qaClassification, 'Concordant');
});

test('position totals are blank when any position lacks that value', () => {
  const { NS } = boot();
  const o = NS.sirtSourceParity.calculateDerived({}, [{ activity: '1.6', tumourVolume: '' }, { activity: '1.5', tumourVolume: '70' }]);
  assert.equal(o.positionsTotalActivity, '3.10');
  assert.equal(o.positionsTotalTumour, '');
});

function patient(id, data, extra = {}) {
  return { patientId: id, oncologyEpisodes: { onc1: { oncologyEpisodeId: 'onc1', treatments: [{ treatmentEpisodeId: 'tx-' + id, modality: 'SIRT', data, audit: [], ...extra }] } } };
}

test('scan is read-only and classifies fabricated vs unknown-source values', async () => {
  const contaminated = { assayedActivity: '3.4', treatmentPerfusedCBCTVolume: '980', ...original({ assayedActivity: '3.4', treatmentPerfusedCBCTVolume: '980' }, []) };
  const imported = { deliveryEfficiency: '91.2' }; // inputs blank, value not producible by the engine → came from elsewhere
  const clean = { assayedActivity: '3.4', deliveredActivity: '3.1', deliveryEfficiency: '91.2' };
  const { NS, store } = boot([patient('P1', contaminated), patient('P2', imported), patient('P3', clean)]);
  const before = JSON.stringify([...store.patients.values()]);
  const { summary, rows } = await NS.v11616.scan();
  assert.equal(JSON.stringify([...store.patients.values()]), before);
  assert.equal(summary.sirtRecordsScanned, 3);
  assert.ok(rows.filter((r) => r.treatmentEpisodeId === 'tx-P1').every((r) => r.classification === 'FABRICATED_BY_V116_BUG'));
  assert.ok(rows.some((r) => r.treatmentEpisodeId === 'tx-P1' && r.field === 'qaClassification'));
  assert.deepEqual([...rows.filter((r) => r.treatmentEpisodeId === 'tx-P2').map((r) => r.classification)], ['REVIEW_SOURCE_UNKNOWN']);
  assert.equal(rows.filter((r) => r.treatmentEpisodeId === 'tx-P3').length, 0);
});

test('repair refuses without confirm and reviewer', async () => {
  const { NS } = boot();
  await assert.rejects(NS.v11616.repair({ reviewer: 'Dr Test' }), /confirm/);
  await assert.rejects(NS.v11616.repair({ confirm: true }), /reviewer/);
});

test('repair clears only fabricated values, audits each record, leaves unknown-source values, and is idempotent', async () => {
  const contaminated = { assayedActivity: '3.4', treatmentPerfusedCBCTVolume: '980', ...original({ assayedActivity: '3.4', treatmentPerfusedCBCTVolume: '980' }, []) };
  const { NS, store } = boot([patient('P1', contaminated), patient('P2', { deliveryEfficiency: '91.2' })]);
  const r1 = await NS.v11616.repair({ reviewer: 'Dr Synthetic', confirm: true });
  assert.equal(r1.recordsRepaired, 1);
  const tx1 = store.patients.get('P1').oncologyEpisodes.onc1.treatments[0];
  assert.equal(tx1.data.deliveryEfficiency, '');
  assert.equal(tx1.data.qaClassification, '');
  assert.equal(tx1.data.assayedActivity, '3.4'); // source inputs untouched
  assert.ok(tx1.audit.every((a) => a.reviewedBy === 'Dr Synthetic' && a.after === ''));
  assert.equal(store.audit.length, 1);
  assert.equal(store.audit[0].details.reviewer, 'Dr Synthetic');
  assert.equal(store.patients.get('P2').oncologyEpisodes.onc1.treatments[0].data.deliveryEfficiency, '91.2');
  const r2 = await NS.v11616.repair({ reviewer: 'Dr Synthetic', confirm: true });
  assert.equal(r2.recordsRepaired, 0);
});

test('patch is inert when loaded twice or when the engine is absent', () => {
  const { NS } = boot();
  const guarded = NS.sirtSourceParity.calculateDerived;
  vm.runInNewContext(PATCH, { window: { RLH: NS, __RLH_V11616_DERIVED_BLANK_GUARD__: true }, console, structuredClone });
  assert.equal(NS.sirtSourceParity.calculateDerived, guarded);
  const errors = [];
  vm.runInNewContext(PATCH, { window: { RLH: {} }, console: { error: (m) => errors.push(m) }, structuredClone });
  assert.match(errors[0], /NOT APPLIED/);
});

test('replaces the frozen parity object: other functions preserved, result still frozen', () => {
  const { NS } = boot();
  assert.equal(Object.isFrozen(NS.sirtSourceParity), true);
  assert.equal(NS.sirtSourceParity.validate(), 'validate-untouched');
  assert.notEqual(NS.sirtSourceParity.calculateDerived, original);
  assert.equal(NS.PATCHES.at(-1).applied, true);
});

test('refuses to run (and says so) when placed after the SIRT module has captured the engine', () => {
  const { NS } = boot([], { sirtUI: {} });
  assert.equal(NS.sirtSourceParity.calculateDerived, original);
  assert.equal(NS.v11616, undefined);
  assert.equal(NS.PATCHES.at(-1).applied, false);
});

test('patcher.html embeds exactly the current patch source', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'patcher.html'), 'utf8');
  const m = html.match(/<script type="text\/plain" id="patch-src">([\s\S]*?)<\/script>/);
  assert.ok(m, 'patch-src block present');
  assert.equal(m[1], PATCH);
});

test('patcher.html inline scripts compile (no premature closing tag)', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'patcher.html'), 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new vm.Script(scripts[0]));
  assert.match(scripts[0], /window\.__v11616Patcher = \{ applyPatch \}/);
});

test('fabricated QA flag on a complete record is corrected to the true value, not blanked', async () => {
  const d = { assayedActivity: '3.4', deliveredActivity: '3.1', plannedActivity: '3.2', treatmentPerfusedCBCTVolume: '980', treatmentTumourVolume: '142' };
  const stored = { ...d, ...original(d, []) }; // QA "Clinically significant variance" from blank post-treatment volume
  assert.equal(stored.qaClassification, 'Clinically significant variance');
  const { NS, store } = boot([patient('P9', stored)]);
  const { rows } = await NS.v11616.scan();
  const qa = rows.find((r) => r.field === 'qaClassification');
  assert.equal(qa.classification, 'FABRICATED_BY_V116_BUG');
  assert.equal(qa.correctedValue, 'Concordant');
  await NS.v11616.repair({ reviewer: 'Dr Synthetic', confirm: true });
  const after = store.patients.get('P9').oncologyEpisodes.onc1.treatments[0].data;
  assert.equal(after.qaClassification, 'Concordant');
  assert.equal(after.perfusedVolumeVariancePercent, '');
  assert.equal(after.deliveryEfficiency, stored.deliveryEfficiency); // correct values untouched
});
