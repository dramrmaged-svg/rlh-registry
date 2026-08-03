export interface ReadinessFinding {
  code: string;
  severity: 'BLOCK' | 'WARNING';
  message: string;
  field?: string;
}

export interface EpisodeForReadinessCheck {
  firstOrRepeat: 'FIRST' | 'REPEAT';
  previousEpisodeId: string | null;
}

/**
 * Structural findings that must hold at all times, independent of any
 * particular status transition. A REPEAT episode with no previousEpisodeId
 * is a broken reference chain — always a hard block.
 */
export function evaluateEpisodeStructuralReadiness(episode: EpisodeForReadinessCheck): ReadinessFinding[] {
  const findings: ReadinessFinding[] = [];
  if (episode.firstOrRepeat === 'REPEAT' && !episode.previousEpisodeId) {
    findings.push({
      code: 'REPEAT_EPISODE_MISSING_PREVIOUS_EPISODE',
      severity: 'BLOCK',
      message: 'A repeat SIRT episode must reference the previous episode it follows.',
      field: 'previousEpisodeId',
    });
  }
  return findings;
}

export interface EpisodeForCompletionReadinessCheck {
  status: string;
  diagnosisId: string | null;
}

/**
 * Findings gated specifically on the -> COMPLETED transition. COMPLETED
 * means "finished, reportable" — it must not retain unresolved BLOCK-severity
 * findings. Kept intentionally small this phase (diagnosis presence only);
 * Phase 2 modules (mapping/dosimetry/treatment/follow-up) extend this list
 * once their own readiness rules exist.
 */
export function evaluateEpisodeCompletionReadiness(episode: EpisodeForCompletionReadinessCheck): ReadinessFinding[] {
  const findings: ReadinessFinding[] = [];
  if (!episode.diagnosisId) {
    findings.push({
      code: 'COMPLETED_EPISODE_MISSING_DIAGNOSIS',
      severity: 'BLOCK',
      message: 'An episode cannot be marked Completed without a recorded diagnosis.',
      field: 'diagnosisId',
    });
  }
  return findings;
}

export interface EpisodeForMdtApprovalReadinessCheck {
  mdtRecordCount: number;
}

/**
 * Findings gated on the -> MDT_APPROVED transition. Analogous to the master
 * spec's "a confirmed treatment should have a treatment session" rule: an
 * episode moving to MDT_APPROVED should have at least one MDT record, but
 * legitimate exceptions exist (e.g. urgent pathway, retrospective catch-up
 * entry) so this is WARNING-severity with an override-reason escape hatch,
 * not a hard block.
 */
export function evaluateMdtApprovalReadiness(episode: EpisodeForMdtApprovalReadinessCheck): ReadinessFinding[] {
  const findings: ReadinessFinding[] = [];
  if (episode.mdtRecordCount === 0) {
    findings.push({
      code: 'MDT_APPROVED_WITHOUT_MDT_RECORD',
      severity: 'WARNING',
      message: 'This episode has no recorded MDT discussion yet.',
    });
  }
  return findings;
}

export interface TreatmentSessionReadinessCheck {
  hasApprovedDosimetryPlan: boolean;
}

/**
 * Findings gated on creating a TreatmentSession. Per
 * docs/adr/0001-episode-architecture.md, a treatment session before an
 * approved dosimetry plan is clinically unusual but not impossible
 * (urgent/compassionate pathways) — WARNING, override-able, reusing the
 * mechanism built for the Episode module rather than a new one.
 */
export function evaluateTreatmentSessionReadiness(check: TreatmentSessionReadinessCheck): ReadinessFinding[] {
  const findings: ReadinessFinding[] = [];
  if (!check.hasApprovedDosimetryPlan) {
    findings.push({
      code: 'TREATMENT_WITHOUT_APPROVED_DOSIMETRY_PLAN',
      severity: 'WARNING',
      message: 'This episode has no approved dosimetry plan yet.',
    });
  }
  return findings;
}

export interface OverrideWarning {
  code: string;
  reason: string;
}

export const MIN_OVERRIDE_REASON_LENGTH = 10;

/**
 * Splits a set of findings against a caller-supplied list of overrides.
 * BLOCK findings are never overridable and always end up in `unresolved`.
 * A WARNING finding is resolved only if the caller supplied a matching
 * `code` with a reason of at least MIN_OVERRIDE_REASON_LENGTH characters,
 * matching the existing MDT unlock-reason convention
 * (mdt.service.ts `unlock()`).
 */
export function resolveReadinessFindings(
  findings: ReadinessFinding[],
  overrideWarnings: OverrideWarning[] = [],
): { unresolved: ReadinessFinding[]; overridden: OverrideWarning[] } {
  const overridden: OverrideWarning[] = [];
  const unresolved: ReadinessFinding[] = [];
  for (const finding of findings) {
    if (finding.severity === 'BLOCK') {
      unresolved.push(finding);
      continue;
    }
    const match = overrideWarnings.find((o) => o.code === finding.code && o.reason && o.reason.trim().length >= MIN_OVERRIDE_REASON_LENGTH);
    if (match) {
      overridden.push(match);
    } else {
      unresolved.push(finding);
    }
  }
  return { unresolved, overridden };
}
