const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');
// Usage: node test/e2e-v116.js <path to a V116.15 HTML build WITHOUT embedded patient data>
// Drives the real application in headless Chromium: patches it via patcher.html, then checks the
// SIRT autosave code path, scan/repair on a synthetic record, and the misplaced-patch banner.
const INPUT = process.argv[2];
if (!INPUT) { console.error('usage: node test/e2e-v116.js <v116.html>'); process.exit(2); }
const srcHtml = fs.readFileSync(INPUT, 'utf8');
if (/"patientName"\s*:\s*"[^"]+"|"dob"\s*:\s*"\d{4}-\d{2}-\d{2}"/.test(srcHtml)) {
  console.error('Refusing: input appears to contain embedded patient identifiers. Use a build without the v116.5 data block.');
  process.exit(3);
}
const P = path.join(__dirname, '..');
const S = fs.mkdtempSync(path.join(os.tmpdir(), 'v11616-e2e-'));
fs.copyFileSync(INPUT, path.join(S, 'v116_nopid.html'));
{
  const patch = fs.readFileSync(path.join(P, 'rlh-v11616-derived-blank-guard.js'), 'utf8');
  const i = srcHtml.lastIndexOf('</body>');
  fs.writeFileSync(path.join(S, 'v116_misplaced.html'), srcHtml.slice(0, i) + '<script id="rlh-v11616-derived-blank-guard">\n' + patch + '\n</script>\n' + srcHtml.slice(i));
}
async function probe(browser, file) {
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
  await page.goto('file://' + file);
  await page.waitForFunction(() => window.RLH && window.RLH.sirtUI && window.RLH.db, null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(async () => {
    const NS = window.RLH;
    const blank = { data: { assayedActivity: '3.4', treatmentPerfusedCBCTVolume: '980' }, treatmentPositions: [] };
    NS.sirtUI.derived(blank);
    const full = { data: { assayedActivity:'3.4', deliveredActivity:'3.1', residualActivity:'0.3', plannedActivity:'3.2', treatmentPerfusedCBCTVolume:'980', treatmentTumourVolume:'142' }, treatmentPositions: [] };
    NS.sirtUI.derived(full);
    const keys = ['deliveryEfficiency','residualFraction','tumourBurdenPercent','calculatedNormalLiverVolume','activityPerPerfusedLitre','perfusedVolumeVariancePercent','qaClassification','positionsTotalActivity'];
    const banner = [...document.querySelectorAll('[role=alert]')].map(b => b.textContent).join(' | ');
    return { version: NS.VERSION, patches: NS.PATCHES || null, banner,
      blank: Object.fromEntries(keys.map(k => [k, blank.data[k]])),
      full: Object.fromEntries(['deliveryEfficiency','residualFraction','tumourBurdenPercent','calculatedNormalLiverVolume','activityVariancePercent','perfusedVolumeVariancePercent','qaClassification'].map(k => [k, full.data[k]])),
      hasRepairApi: !!NS.v11616 };
  });
  if (r.hasRepairApi) {
    r.repairFlow = await page.evaluate(async () => {
      const NS = window.RLH;
      const p = { patientId: 'SYNTH-P1', demographics: { name: 'SYNTHETIC TEST', mrn: 'SYNTH0001', dob: '1950-01-01' }, oncologyEpisodes: { 'onc-s1': { oncologyEpisodeId: 'onc-s1', treatments: [
        { treatmentEpisodeId: 'tx-s1', modality: 'SIRT', data: { assayedActivity:'3.4', treatmentPerfusedCBCTVolume:'980', deliveryEfficiency:'0.0', residualFraction:'0.0', tumourBurdenPercent:'0.0', calculatedNormalLiverVolume:'980.0', activityPerPerfusedLitre:'0.00', perfusedVolumeVariancePercent:'-100.0', qaClassification:'Clinically significant variance', positionsTotalActivity:'0.00', positionsTotalPerfused:'0.0', positionsTotalTumour:'0.0' }, audit: [], treatmentPositions: [] },
        { treatmentEpisodeId: 'tx-s2', modality: 'SIRT', data: { deliveryEfficiency: '91.2' }, audit: [], treatmentPositions: [] } ] } } };
      await NS.db.atomic([{ type: 'put', store: NS.STORES.patients, value: p }]);
      const scan = await NS.v11616.scan();
      let refused = ''; try { await NS.v11616.repair({ reviewer: 'Synthetic Reviewer' }); } catch (e) { refused = e.message; }
      const repair = await NS.v11616.repair({ reviewer: 'Synthetic Reviewer', confirm: true });
      const tx = (await NS.db.get(NS.STORES.patients, 'SYNTH-P1')).oncologyEpisodes['onc-s1'].treatments;
      const audit = (await NS.db.getAll(NS.STORES.audit)).filter(a => a.action === 'SIRT_DERIVED_BLANK_REPAIR_V11616');
      const rescan = await NS.v11616.scan();
      return { scan: scan.summary, refused, repair, tx1: tx[0].data, tx2DeliveryEfficiency: tx[1].data.deliveryEfficiency, recordAudit: tx[0].audit.length, auditEvents: audit.length, auditFields: audit[0] && audit[0].details && audit[0].details.fieldsCleared, rescan: rescan.summary };
    });
  }
  r.pageErrors = errors;
  await ctx.close();
  return r;
}
(async () => {
  const browser = await chromium.launch();
  // 1. Patch through patcher.html, exactly as the user will.
  const ctx = await browser.newContext({ acceptDownloads: true }); const page = await ctx.newPage();
  await page.goto('file://' + P + '/patcher.html');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.setInputFiles('#file', S + '/v116_nopid.html')]);
  const patchedPath = S + '/' + dl.suggestedFilename(); await dl.saveAs(patchedPath);
  const patcherMsg = await page.textContent('#result');
  // 2. Re-patching an already patched file must be refused.
  await page.setInputFiles('#file', patchedPath); await page.waitForTimeout(500);
  const repatchMsg = await page.textContent('#result');
  await ctx.close();
  const out = { patcher: { file: dl.suggestedFilename(), message: patcherMsg.replace(/\s+/g, ' ').slice(0, 300), repatch: repatchMsg.replace(/\s+/g, ' ') } };
  out.unpatched = await probe(browser, S + '/v116_nopid.html');
  out.patched = await probe(browser, patchedPath);
  out.misplaced = await probe(browser, S + '/v116_misplaced.html');
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
