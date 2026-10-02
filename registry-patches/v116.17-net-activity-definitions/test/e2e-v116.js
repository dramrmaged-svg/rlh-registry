'use strict';
// Usage: node test/e2e-v116.js <V116.15 HTML build WITHOUT embedded patient data>
// Drives the real application in headless Chromium: applies v116.16 then v116.17 through their patchers,
// enters a synthetic SIRT treatment through the form, and checks stored values, labels, the new field,
// Cohort visibility, re-render stability, scan/repair, and patcher refusals. Prints JSON; exits 1 on failure.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const INPUT = process.argv[2];
if (!INPUT) { console.error('usage: node test/e2e-v116.js <v116.html>'); process.exit(2); }
const srcHtml = fs.readFileSync(INPUT, 'utf8');
if (/"patientName"\s*:\s*"[^"]+"|"dob"\s*:\s*"\d{4}-\d{2}-\d{2}"/.test(srcHtml)) {
  console.error('Refusing: input appears to contain embedded patient identifiers. Use a build without the v116.5 data block.');
  process.exit(3);
}
const HERE = path.join(__dirname, '..');
const P16 = path.join(HERE, '..', 'v116.16-derived-blank-guard', 'patcher.html');
const P17 = path.join(HERE, 'patcher.html');
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'v11617-e2e-'));

async function patchVia(browser, patcher, file) {
  const ctx = await browser.newContext({ acceptDownloads: true }); const pg = await ctx.newPage();
  await pg.goto('file://' + patcher);
  const dlP = pg.waitForEvent('download', { timeout: 15000 }).catch(() => null);
  await pg.setInputFiles('#file', file);
  const dl = await dlP;
  await pg.waitForTimeout(300);
  const msg = (await pg.textContent('#result')).replace(/\s+/g, ' ').trim();
  let saved = null;
  if (dl) { saved = path.join(OUT, dl.suggestedFilename()); await dl.saveAs(saved); }
  await ctx.close();
  return { saved, msg };
}

async function openApp(browser, file) {
  const ctx = await browser.newContext(); const pg = await ctx.newPage();
  const errors = []; pg.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  await pg.goto('file://' + file);
  await pg.waitForFunction(() => window.RLH && window.RLH.sirtUI && window.RLH.sirtService, null, { timeout: 30000 });
  return { ctx, pg, errors };
}
const enter = async (pg) => { await pg.click('#rlhEnterClinical', { timeout: 3000 }).catch(() => {}); await pg.waitForTimeout(300); };

async function setupSirt(pg) {
  await pg.evaluate(async () => {
    const NS = window.RLH;
    const p = { patientId: 'SYNTH-P1', demographics: { name: 'SYNTHETIC TEST', mrn: 'SYNTH0001', dob: '1950-01-01', sex: 'Male' },
      oncologyEpisodes: { 'onc-s1': { oncologyEpisodeId: 'onc-s1', episodeDate: '2026-03-01', diagnosis: 'HCC', mdtEpisodes: [], treatments: [], followUp: [], complications: [] } },
      createdAt: NS.isoNow(), updatedAt: NS.isoNow() };
    await NS.db.atomic([{ type: 'put', store: NS.STORES.patients, value: p }]);
    localStorage.setItem('rlh-ir-oncology.ui.currentPatientId', 'SYNTH-P1');
    localStorage.setItem('rlh-ir-oncology.ui.currentEpisodeId', 'onc-s1');
    await NS.sirtService.create();
  });
  await pg.reload();
  await pg.waitForFunction(() => window.RLH && window.RLH.sirtUI, null, { timeout: 30000 });
  await enter(pg);
  await pg.click('[data-route="sirt"]'); await pg.waitForTimeout(1200);
  await pg.click('[data-sirt-tab="treatment"]'); await pg.waitForTimeout(800);
  for (const [k, v] of Object.entries(INPUTS)) await pg.fill(`[data-sirt-field="${k}"]`, v);
  await pg.waitForTimeout(3500); // autosave debounce
}
async function idleMutations(pg, tab) {
  await pg.click(`[data-sirt-tab="${tab}"]`); await pg.waitForTimeout(1500);
  return pg.evaluate(() => new Promise((res) => {
    const root = document.querySelector('#route-sirt'); let n = 0;
    const mo = new MutationObserver((ms) => { n += ms.length; }); mo.observe(root, { childList: true, subtree: true, characterData: true, attributes: true });
    setTimeout(() => { mo.disconnect(); res(n); }, 3000);
  }));
}

const INPUTS = { assayedActivity: '3.4', deliveredActivity: '3.2', residualActivity: '0.2', plannedActivity: '3.2', treatmentPerfusedCBCTVolume: '980', treatmentTumourVolume: '142' };

(async () => {
  const browser = await chromium.launch();
  const r = { checks: {} };
  const check = (name, ok, detail) => { r.checks[name] = { ok: !!ok, detail }; };

  // ---- patchers ----
  const a = await patchVia(browser, P16, INPUT);
  const refuse17Unpatched = await patchVia(browser, P17, INPUT);
  const b = await patchVia(browser, P17, a.saved);
  const refuse17Twice = await patchVia(browser, P17, b.saved);
  check('patcher16 produced file', !!a.saved, a.msg.slice(0, 80));
  check('patcher17 refuses without v116.16', !refuse17Unpatched.saved && /v116\.16 is not present/.test(refuse17Unpatched.msg), refuse17Unpatched.msg);
  check('patcher17 produced file with 8 edits', !!b.saved && /Source edits applied \(8\)/.test(b.msg), b.msg.slice(0, 160));
  check('patcher17 refuses double patch', !refuse17Twice.saved && /already contains patch v116\.17/.test(refuse17Twice.msg), refuse17Twice.msg);

  // ---- real UI, double-patched build ----
  const { ctx, pg, errors } = await openApp(browser, b.saved);
  await setupSirt(pg);
  const treatmentView = await pg.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const lbl = q('[data-sirt-field="deliveredActivity"]')?.closest('.field')?.textContent || '';
    const helpFor = (k) => q(`.v11615-auto-item strong[data-sirt-derived="${k}"]`)?.parentElement?.querySelector('small')?.textContent || '';
    return { deliveredLabel: lbl.replace(/\s+/g, ' ').trim().slice(0, 80),
      panelDeliveryEfficiency: q('.v11615-auto-item strong[data-sirt-derived="deliveryEfficiency"]')?.textContent,
      helpDeliveryEfficiency: helpFor('deliveryEfficiency'), helpPerLitre: helpFor('activityPerPerfusedLitre') };
  });
  const stored = await pg.evaluate(async () => {
    const p = await window.RLH.db.get(window.RLH.STORES.patients, 'SYNTH-P1');
    const d = p.oncologyEpisodes['onc-s1'].treatments[0].data;
    return Object.fromEntries(['deliveredActivity', 'residualActivity', 'deliveryEfficiency', 'activityPerPerfusedLitre', 'activityVariancePercent', 'plannedActivityAdministeredPercent', 'qaClassification', 'residualFraction', 'tumourBurdenPercent'].map((k) => [k, d[k]]));
  });
  r.treatmentView = treatmentView; r.stored = stored;
  check('form label says gross', /gross, before residual/.test(treatmentView.deliveredLabel), treatmentView.deliveredLabel);
  check('panel help: efficiency net ÷ gross', /Net activity \(delivered − residual\) ÷ delivered \(gross\)/.test(treatmentView.helpDeliveryEfficiency), treatmentView.helpDeliveryEfficiency);
  check('panel help: per litre net', /Net activity/.test(treatmentView.helpPerLitre), treatmentView.helpPerLitre);
  check('stored via autosave: efficiency 93.8', stored.deliveryEfficiency === '93.8', stored.deliveryEfficiency);
  check('stored: planned administered 93.8', stored.plannedActivityAdministeredPercent === '93.8', stored.plannedActivityAdministeredPercent);
  check('stored: variance -6.3', stored.activityVariancePercent === '-6.3', stored.activityVariancePercent);
  check('stored: per litre 3.06', stored.activityPerPerfusedLitre === '3.06', stored.activityPerPerfusedLitre);
  check('stored: QA Concordant (no false flag)', stored.qaClassification === 'Concordant', stored.qaClassification);
  check('stored: source inputs unchanged', stored.deliveredActivity === '3.2' && stored.residualActivity === '0.2');

  await pg.click('[data-sirt-tab="qa"]'); await pg.waitForTimeout(800);
  const qaView = await pg.evaluate(() => {
    const el = document.querySelector('[data-sirt-field="plannedActivityAdministeredPercent"]');
    const item = document.querySelector('.v11615-auto-item strong[data-sirt-derived="plannedActivityAdministeredPercent"]');
    const varHelp = document.querySelector('.v11615-auto-item strong[data-sirt-derived="activityVariancePercent"]')?.parentElement?.querySelector('small')?.textContent || '';
    return { fieldPresent: !!el, readonly: !!(el && (el.readOnly || el.disabled)), value: el ? el.value : null,
      label: el?.closest('.field')?.textContent.replace(/\s+/g, ' ').trim().slice(0, 60), autoItem: item ? item.textContent : null, varHelp };
  });
  r.qaView = qaView;
  check('QA tab: new field present, read-only, 93.8', qaView.fieldPresent && qaView.readonly && qaView.value === '93.8', qaView);
  check('QA panel: new auto row 93.8', qaView.autoItem === '93.8', qaView.autoItem);
  check('QA panel help: variance net', /Net administered/.test(qaView.varHelp), qaView.varHelp);

  await pg.click('[data-sirt-tab="overview"]'); await pg.waitForTimeout(800);
  const caption = await pg.evaluate(() => document.querySelector('.kpi b[data-sirt-derived="deliveryEfficiency"]')?.parentElement?.querySelector('small')?.textContent);
  check('overview caption net ÷ delivered', /net \(delivered − residual\) ÷ delivered/.test(caption || ''), caption);

  const mutations17 = {};
  for (const tab of ['treatment', 'qa', 'overview']) mutations17[tab] = await idleMutations(pg, tab);
  r.mutations17 = mutations17;

  await pg.click('[data-route="cohort"]'); await pg.waitForTimeout(2000); // dictionary is built when Cohort opens
  const cohort = await pg.evaluate(() => { const t = JSON.stringify(window.RLH.cohortUI || {}); return { newField: t.includes('sirt.plannedActivityAdministeredPercent'), control: t.includes('sirt.activityVariancePercent') }; });
  check('Cohort field dictionary includes the new field', cohort.newField && cohort.control, cohort);

  const reg = await pg.evaluate(async () => {
    const NS = window.RLH;
    const banner = [...document.querySelectorAll('[role=alert]')].map((b) => b.textContent).join(' | ');
    const s16 = (await NS.v11616.scan()).summary, s17 = (await NS.v11617.scan()).summary;
    return { patches: NS.PATCHES, banner, s16, s17 };
  });
  r.registry = reg;
  check('both patches applied, self-tests pass, no banner', reg.patches.filter((p) => p.applied && p.selfTest).length === 2 && !reg.banner, reg.patches);
  check('scans clean for a record saved under v116.17', reg.s16.fabricatedValues === 0 && reg.s17.valuesToRecalculate === 0, { s16: reg.s16, s17: reg.s17 });
  check('no page errors', errors.length === 0, errors);
  await ctx.close();

  // ---- comparison: identical UI run under v116.16 only ----
  {
    const { ctx: c2, pg: p2 } = await openApp(browser, a.saved);
    await setupSirt(p2);
    const v16 = await p2.evaluate(async () => { const p = await window.RLH.db.get(window.RLH.STORES.patients, 'SYNTH-P1'); const d = p.oncologyEpisodes['onc-s1'].treatments[0].data; return { deliveryEfficiency: d.deliveryEfficiency, activityVariancePercent: d.activityVariancePercent }; });
    r.v116_16_only = v16;
    check('v116.16 alone keeps gross definitions (94.1 / 0.0)', v16.deliveryEfficiency === '94.1' && v16.activityVariancePercent === '0.0', v16);
    const mutations16 = {};
    for (const tab of ['treatment', 'qa', 'overview']) mutations16[tab] = await idleMutations(p2, tab);
    r.mutations16 = mutations16;
    // V116.15 already re-renders continuously on the SIRT screen (audit F14); v116.17 must add nothing to it.
    check('no extra re-render activity vs v116.16', Object.keys(mutations16).every((t) => r.mutations17[t] <= mutations16[t] * 1.1 + 5), { v17: r.mutations17, v16: mutations16 });
    await c2.close();
  }
  await browser.close();
  r.passed = Object.values(r.checks).filter((c) => c.ok).length;
  r.failed = Object.entries(r.checks).filter(([, c]) => !c.ok).map(([k]) => k);
  console.log(JSON.stringify(r, null, 1));
  process.exit(r.failed.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
