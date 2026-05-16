export function generatePlanReport(data){
  return [
    'SIRT Planning Summary (Decision Support Only)',
    `Patient/MDT: ${data.patientSummary || 'N/A'}`,
    `Imaging: ${data.imagingSummary || 'N/A'}`,
    `Mapping: ${data.mappingSummary || 'N/A'}`,
    `MAA concordance: ${data.maaConcordance || 'N/A'} | Extrahepatic uptake: ${data.extrahepaticUptake || 'N/A'}`,
    `Calculated MIRD activity: ${data.mirdActivity ?? 'N/A'} GBq`,
    `Risk flags: ${data.riskFlags?.length ? data.riskFlags.join('; ') : 'None auto-detected'}`,
    `Proposed strategy: ${data.strategy || 'N/A'}`,
    'Consultant sign-off required: IR / NM / Radiology / MDT / local governance.'
  ].join('\n');
}
