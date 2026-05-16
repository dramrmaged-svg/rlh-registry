export function calculateBSA(heightCm, weightKg){
  if(!heightCm || !weightKg) return null;
  return Math.sqrt((heightCm*weightKg)/3600);
}
export function calculateMELDNa({bilirubin,inr,creatinine,sodium}){
  if(!bilirubin || !inr || !creatinine || !sodium) return null;
  const meld = 3.78*Math.log(Math.max(bilirubin,1)) + 11.2*Math.log(Math.max(inr,1)) + 9.57*Math.log(Math.max(creatinine,1)) + 6.43;
  return meld + 1.32*(137-sodium) - (0.033*meld*(137-sodium));
}
export function calculateALBI({bilirubin,albumin}){
  if(!bilirubin || !albumin) return null;
  const albi = (Math.log10(bilirubin)*0.66) + (albumin*-0.085);
  return albi;
}
export function calculateMIRDActivity(desiredDoseGy, perfusedVolumeMl){
  if(!desiredDoseGy || !perfusedVolumeMl) return null;
  return (desiredDoseGy*perfusedVolumeMl/1000)/50;
}
