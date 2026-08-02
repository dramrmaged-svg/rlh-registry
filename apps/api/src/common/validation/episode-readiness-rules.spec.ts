import {
  evaluateEpisodeStructuralReadiness,
  evaluateEpisodeCompletionReadiness,
  evaluateMdtApprovalReadiness,
  resolveReadinessFindings,
} from './episode-readiness-rules';

describe('evaluateEpisodeStructuralReadiness', () => {
  it('blocks a REPEAT episode with no previousEpisodeId', () => {
    const findings = evaluateEpisodeStructuralReadiness({ firstOrRepeat: 'REPEAT', previousEpisodeId: null });
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('BLOCK');
    expect(findings[0].code).toBe('REPEAT_EPISODE_MISSING_PREVIOUS_EPISODE');
  });

  it('passes a REPEAT episode with a previousEpisodeId', () => {
    expect(evaluateEpisodeStructuralReadiness({ firstOrRepeat: 'REPEAT', previousEpisodeId: 'ep-1' })).toHaveLength(0);
  });

  it('passes a FIRST episode regardless of previousEpisodeId', () => {
    expect(evaluateEpisodeStructuralReadiness({ firstOrRepeat: 'FIRST', previousEpisodeId: null })).toHaveLength(0);
  });
});

describe('evaluateEpisodeCompletionReadiness', () => {
  it('blocks completion without a diagnosis', () => {
    const findings = evaluateEpisodeCompletionReadiness({ status: 'IMAGING_FOLLOW_UP', diagnosisId: null });
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('BLOCK');
  });

  it('passes completion with a diagnosis recorded', () => {
    expect(evaluateEpisodeCompletionReadiness({ status: 'IMAGING_FOLLOW_UP', diagnosisId: 'dx-1' })).toHaveLength(0);
  });
});

describe('evaluateMdtApprovalReadiness', () => {
  it('warns when there is no MDT record yet', () => {
    const findings = evaluateMdtApprovalReadiness({ mdtRecordCount: 0 });
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('WARNING');
  });

  it('passes when at least one MDT record exists', () => {
    expect(evaluateMdtApprovalReadiness({ mdtRecordCount: 1 })).toHaveLength(0);
  });
});

describe('resolveReadinessFindings', () => {
  it('never resolves a BLOCK finding regardless of overrides', () => {
    const findings = [{ code: 'X', severity: 'BLOCK' as const, message: 'x' }];
    const { unresolved, overridden } = resolveReadinessFindings(findings, [{ code: 'X', reason: 'a very good reason indeed' }]);
    expect(unresolved).toHaveLength(1);
    expect(overridden).toHaveLength(0);
  });

  it('resolves a WARNING finding with a matching code and a reason >= 10 characters', () => {
    const findings = [{ code: 'W', severity: 'WARNING' as const, message: 'w' }];
    const { unresolved, overridden } = resolveReadinessFindings(findings, [{ code: 'W', reason: 'clinically justified exception' }]);
    expect(unresolved).toHaveLength(0);
    expect(overridden).toHaveLength(1);
  });

  it('leaves a WARNING finding unresolved when the override reason is too short', () => {
    const findings = [{ code: 'W', severity: 'WARNING' as const, message: 'w' }];
    const { unresolved } = resolveReadinessFindings(findings, [{ code: 'W', reason: 'short' }]);
    expect(unresolved).toHaveLength(1);
  });

  it('leaves a WARNING finding unresolved when no override is supplied', () => {
    const findings = [{ code: 'W', severity: 'WARNING' as const, message: 'w' }];
    expect(resolveReadinessFindings(findings, []).unresolved).toHaveLength(1);
  });

  it('leaves a WARNING finding unresolved when the override code does not match', () => {
    const findings = [{ code: 'W', severity: 'WARNING' as const, message: 'w' }];
    const { unresolved } = resolveReadinessFindings(findings, [{ code: 'OTHER', reason: 'a perfectly good reason' }]);
    expect(unresolved).toHaveLength(1);
  });
});
