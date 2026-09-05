"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MIN_OVERRIDE_REASON_LENGTH = void 0;
exports.evaluateEpisodeStructuralReadiness = evaluateEpisodeStructuralReadiness;
exports.evaluateEpisodeCompletionReadiness = evaluateEpisodeCompletionReadiness;
exports.evaluateMdtApprovalReadiness = evaluateMdtApprovalReadiness;
exports.evaluateTreatmentSessionReadiness = evaluateTreatmentSessionReadiness;
exports.resolveReadinessFindings = resolveReadinessFindings;
/**
 * Structural findings that must hold at all times, independent of any
 * particular status transition. A REPEAT episode with no previousEpisodeId
 * is a broken reference chain — always a hard block.
 */
function evaluateEpisodeStructuralReadiness(episode) {
    const findings = [];
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
/**
 * Findings gated specifically on the -> COMPLETED transition. COMPLETED
 * means "finished, reportable" — it must not retain unresolved BLOCK-severity
 * findings. Kept intentionally small this phase (diagnosis presence only);
 * Phase 2 modules (mapping/dosimetry/treatment/follow-up) extend this list
 * once their own readiness rules exist.
 */
function evaluateEpisodeCompletionReadiness(episode) {
    const findings = [];
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
/**
 * Findings gated on the -> MDT_APPROVED transition. Analogous to the master
 * spec's "a confirmed treatment should have a treatment session" rule: an
 * episode moving to MDT_APPROVED should have at least one MDT record, but
 * legitimate exceptions exist (e.g. urgent pathway, retrospective catch-up
 * entry) so this is WARNING-severity with an override-reason escape hatch,
 * not a hard block.
 */
function evaluateMdtApprovalReadiness(episode) {
    const findings = [];
    if (episode.mdtRecordCount === 0) {
        findings.push({
            code: 'MDT_APPROVED_WITHOUT_MDT_RECORD',
            severity: 'WARNING',
            message: 'This episode has no recorded MDT discussion yet.',
        });
    }
    return findings;
}
/**
 * Findings gated on creating a TreatmentSession. Per
 * docs/adr/0001-episode-architecture.md, a treatment session before an
 * approved dosimetry plan is clinically unusual but not impossible
 * (urgent/compassionate pathways) — WARNING, override-able, reusing the
 * mechanism built for the Episode module rather than a new one.
 */
function evaluateTreatmentSessionReadiness(check) {
    const findings = [];
    if (!check.hasApprovedDosimetryPlan) {
        findings.push({
            code: 'TREATMENT_WITHOUT_APPROVED_DOSIMETRY_PLAN',
            severity: 'WARNING',
            message: 'This episode has no approved dosimetry plan yet.',
        });
    }
    return findings;
}
exports.MIN_OVERRIDE_REASON_LENGTH = 10;
/**
 * Splits a set of findings against a caller-supplied list of overrides.
 * BLOCK findings are never overridable and always end up in `unresolved`.
 * A WARNING finding is resolved only if the caller supplied a matching
 * `code` with a reason of at least MIN_OVERRIDE_REASON_LENGTH characters,
 * matching the existing MDT unlock-reason convention
 * (mdt.service.ts `unlock()`).
 */
function resolveReadinessFindings(findings, overrideWarnings = []) {
    const overridden = [];
    const unresolved = [];
    for (const finding of findings) {
        if (finding.severity === 'BLOCK') {
            unresolved.push(finding);
            continue;
        }
        const match = overrideWarnings.find((o) => o.code === finding.code && o.reason && o.reason.trim().length >= exports.MIN_OVERRIDE_REASON_LENGTH);
        if (match) {
            overridden.push(match);
        }
        else {
            unresolved.push(finding);
        }
    }
    return { unresolved, overridden };
}
