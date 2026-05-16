import { calculateBSA, calculateMELDNa, calculateALBI, calculateMIRDActivity } from './calculations.js';
import { generateRiskFlags, suggestTreatmentStrategy } from './risk_engine.js';
import { generatePlanReport } from './report_generator.js';
import { saveCase, loadCase, exportJSON, importJSON } from './storage.js';

const form=document.getElementById('caseForm');
const calcs=document.getElementById('calcs');
const flagsEl=document.getElementById('riskFlags');
const dosimetryOutput=document.getElementById('dosimetryOutput');
const status=document.getElementById('planningStatus');
const reportEl=document.getElementById('report');

function collect(){
  const fd=new FormData(form); const o=Object.fromEntries(fd.entries());
  ['bilirubin','albumin','inr','creatinine','sodium','heightCm','weightKg','lsf','desiredDoseGy','perfusedVolumeMl'].forEach(k=>o[k]=o[k]?Number(o[k]):null);
  o.meldNa=calculateMELDNa(o); o.albi=calculateALBI(o); o.bsa=calculateBSA(o.heightCm,o.weightKg);
  o.mirdActivity=calculateMIRDActivity(o.desiredDoseGy,o.perfusedVolumeMl);
  o.riskFlags=generateRiskFlags(o); o.strategy=suggestTreatmentStrategy(o,o.riskFlags);
  return o;
}

function render(){
  const d=collect();
  calcs.textContent=`MELD-Na: ${d.meldNa?.toFixed(1) ?? 'N/A'} | ALBI: ${d.albi?.toFixed(2) ?? 'N/A'} | BSA: ${d.bsa?.toFixed(2) ?? 'N/A'}`;
  dosimetryOutput.textContent=`MIRD estimated activity: ${d.mirdActivity?.toFixed(2) ?? 'N/A'} GBq`;
  flagsEl.innerHTML=d.riskFlags.map(f=>`<span class="flag">${f}</span>`).join('');
  status.textContent=d.riskFlags.length ? 'Planning readiness: Review required' : 'Planning readiness: Candidate for consultant review';
  return d;
}
form.addEventListener('input', render);

document.getElementById('saveBtn').onclick=()=>saveCase(collect());
document.getElementById('loadBtn').onclick=()=>{const d=loadCase(); if(!d) return; Object.entries(d).forEach(([k,v])=>{const el=form.elements[k]; if(el) el.value=v ?? '';}); render();};
document.getElementById('exportBtn').onclick=()=>exportJSON(collect());
document.getElementById('importInput').onchange=async (e)=>{const f=e.target.files[0]; if(!f) return; const d=await importJSON(f); Object.entries(d).forEach(([k,v])=>{const el=form.elements[k]; if(el) el.value=v ?? '';}); render();};
document.getElementById('printBtn').onclick=()=>window.print();
document.getElementById('generateBtn').onclick=()=>{reportEl.textContent=generatePlanReport(collect());};

render();
