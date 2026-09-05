import { CalculationResult, calculated, notCalculable } from './types';

/**
 * Faithful port of the legacy app's `bclcStage2022(p)` (line ~6723) — the
 * "BCLC 2022" cascade only (BCLC 2026 refinements, EASL 2022/2024, HKLC, and
 * the full Milan/UCSF/Metroticket transplant-criteria checker are explicitly
 * OUT OF SCOPE for this phase; Metroticket in particular is flagged in the
 * legacy audit as using a fabricated "sum of diameters" heuristic and
 * requires clinical verification before porting — see
 * docs/adr/0001-episode-architecture.md). Milan-eligibility is reproduced
 * here only as the internal input the BCLC cascade itself depends on
 * (`tx.milan` in the legacy source), not exposed as a standalone transplant
 * calculation.
 *
 * FLAGGED (preserved, not fixed): the legacy cascade checks the 'A' branch
 * before the '0' branch, and every input that satisfies the '0' condition
 * (cp==='A' && count===1 && largest<=2 && !pvtt) also satisfies the 'A'
 * condition immediately above it (count===1 && largest<=2 && !pvtt) — so
 * stage '0' can never actually be returned; it is unreachable dead code in
 * the legacy engine. Ported exactly as found (see bclc.spec.ts and
 * docs/adr/0001-episode-architecture.md).
 */
export const BCLC_FORMULA_VERSION = 'LEGACY_BCLC_STAGE_2022_v105';

export type BclcStageValue = '0' | 'A' | 'B' | 'C' | 'D';

export interface BclcInput {
  tumourCount?: number | null;
  largestDiameterCm?: number | null;
  childPughGrade?: 'A' | 'B' | 'C' | null;
  ecogScore?: number | null;
  /** Free text, exactly as the legacy combobox accepted (e.g. "None", "Segmental", "Main"). */
  pvtt?: string | null;
  extrahepaticSpread?: boolean | null;
}

function isMilanEligible(count: number, largest: number, pvtt: string, ehd: boolean): boolean {
  if (ehd || pvtt.includes('main') || pvtt.includes('lobar')) return false;
  return count <= 3 && largest <= 5 && !(count === 1 && largest > 5) && !(count > 1 && largest > 3);
}

export function calculateBclcStage(input: BclcInput): CalculationResult<BclcStageValue> {
  const sourceFields = ['tumourCount', 'largestDiameterCm', 'childPughGrade', 'ecogScore', 'pvtt', 'extrahepaticSpread'];
  const ecog = input.ecogScore ?? NaN;
  const cp = (input.childPughGrade ?? '').toUpperCase();
  const count = input.tumourCount ?? 0;
  const largest = input.largestDiameterCm ?? 0;
  const pvtt = (input.pvtt ?? '').toLowerCase();
  const ehd = input.extrahepaticSpread ?? false;
  const milan = isMilanEligible(count, largest, pvtt, ehd);

  let stage: BclcStageValue | null = null;
  if (cp === 'C' || ecog >= 4) stage = 'D';
  else if (ehd || pvtt.includes('main') || pvtt.includes('lobar') || (!Number.isNaN(ecog) && ecog >= 2)) stage = 'C';
  else if ((cp === 'A' || cp === 'B') && count > 3) stage = 'B';
  else if ((cp === 'A' || cp === 'B') && !(count === 1 && largest <= 2) && !milan) stage = 'B';
  else if ((cp === 'A' || cp === 'B') && ((count === 1 && largest <= 2 && !pvtt) || (milan && cp === 'A'))) stage = 'A';
  else if (cp === 'A' && count === 1 && largest <= 2 && !pvtt) stage = '0';

  if (stage === null) {
    const missingFields = sourceFields.filter((f) => {
      const v = (input as Record<string, unknown>)[f];
      return v === null || v === undefined;
    });
    return notCalculable(BCLC_FORMULA_VERSION, sourceFields, missingFields, 'Insufficient data for BCLC 2022 staging — Child-Pugh grade, ECOG, tumour count/size, PVTT and extrahepatic spread status are all required by the decision cascade.');
  }
  return calculated(stage, BCLC_FORMULA_VERSION, sourceFields, `BCLC 2022 staging cascade (Reig M et al. J Hepatol 2022;76:681-693) as implemented in the legacy app, stage ${stage}.`);
}
