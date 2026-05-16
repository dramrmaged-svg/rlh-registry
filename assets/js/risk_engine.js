export function generateRiskFlags(data){
  const flags=[];
  if((data.bilirubin ?? 0) > 34) flags.push('Bilirubin elevated: poor liver reserve risk');
  if((data.albumin ?? 100) < 28) flags.push('Low albumin: poor liver reserve risk');
  if((data.lsf ?? 0) > 20) flags.push('High lung shunt fraction');
  if((data.maaConcordance||'').toLowerCase().includes('discord')) flags.push('Discordant MAA distribution');
  if((data.extrahepaticUptake||'').toLowerCase().includes('yes')) flags.push('Extrahepatic MAA uptake (hard stop)');
  return flags;
}

export function suggestTreatmentStrategy(data, flags){
  if(flags.some(f=>f.includes('hard stop') || f.includes('Discordant') || f.includes('High lung shunt'))) {
    return 'Revise mapping or MDT decision before treatment consideration.';
  }
  return data.multifocal ?
    'Planning direction appears compatible with lobar or staged bilobar treatment, subject to consultant validation.' :
    'Planning direction appears compatible with selective/segmental treatment, subject to consultant validation.';
}
