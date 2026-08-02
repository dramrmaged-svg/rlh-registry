import { EPISODE_STATUSES, EPISODE_TRANSITIONS, isValidEpisodeTransition, computeEpisodeAvailableActions, RESUMABLE_FROM_DEFERRED } from './episode-status-transitions';

describe('EPISODE_TRANSITIONS', () => {
  it('has an entry for every status', () => {
    for (const status of EPISODE_STATUSES) {
      expect(EPISODE_TRANSITIONS[status]).toBeDefined();
    }
  });

  it('walks the full happy path from REFERRED to COMPLETED', () => {
    const path: (typeof EPISODE_STATUSES)[number][] = [
      'REFERRED', 'AWAITING_MDT', 'MDT_APPROVED', 'CLINIC_ASSESSMENT_COMPLETED',
      'AWAITING_MAPPING', 'MAPPING_COMPLETED', 'AWAITING_DOSIMETRY', 'TREATMENT_APPROVED',
      'AWAITING_TREATMENT', 'TREATMENT_COMPLETED', 'EARLY_FOLLOW_UP', 'IMAGING_FOLLOW_UP', 'COMPLETED',
    ];
    for (let i = 0; i < path.length - 1; i++) {
      expect(isValidEpisodeTransition(path[i], path[i + 1])).toBe(true);
    }
  });

  it('rejects skipping a stage', () => {
    expect(isValidEpisodeTransition('REFERRED', 'MDT_APPROVED')).toBe(false);
    expect(isValidEpisodeTransition('REFERRED', 'COMPLETED')).toBe(false);
  });

  it('rejects any transition out of terminal states', () => {
    for (const terminal of ['COMPLETED', 'CANCELLED', 'NOT_SUITABLE', 'LOST_TO_FOLLOW_UP'] as const) {
      expect(EPISODE_TRANSITIONS[terminal]).toHaveLength(0);
    }
  });

  it('allows cancellation from every pre-treatment-completion state', () => {
    const cancellable = ['REFERRED', 'AWAITING_MDT', 'MDT_APPROVED', 'CLINIC_ASSESSMENT_COMPLETED', 'AWAITING_MAPPING', 'MAPPING_COMPLETED', 'AWAITING_DOSIMETRY', 'TREATMENT_APPROVED', 'AWAITING_TREATMENT'] as const;
    for (const status of cancellable) {
      expect(isValidEpisodeTransition(status, 'CANCELLED')).toBe(true);
    }
  });

  it('does not offer DEFERRED as a normal-graph transition target once past treatment', () => {
    expect(isValidEpisodeTransition('TREATMENT_COMPLETED', 'DEFERRED')).toBe(false);
  });

  it('lists DEFERRED itself as having no outgoing normal-graph transitions (resume is a separate action)', () => {
    expect(EPISODE_TRANSITIONS.DEFERRED).toHaveLength(0);
  });

  it('RESUMABLE_FROM_DEFERRED only contains in-progress (non-terminal) statuses', () => {
    for (const status of RESUMABLE_FROM_DEFERRED) {
      expect(['COMPLETED', 'CANCELLED', 'NOT_SUITABLE', 'LOST_TO_FOLLOW_UP', 'DEFERRED']).not.toContain(status);
    }
  });
});

describe('computeEpisodeAvailableActions', () => {
  it('offers resume (not transition) while DEFERRED', () => {
    const actions = computeEpisodeAvailableActions('DEFERRED');
    expect(actions).toContain('resume');
    expect(actions).not.toContain('transition');
  });

  it('offers transition for a non-terminal, non-deferred status', () => {
    const actions = computeEpisodeAvailableActions('REFERRED');
    expect(actions).toContain('transition');
  });

  it('offers neither transition nor resume for a terminal status', () => {
    const actions = computeEpisodeAvailableActions('COMPLETED');
    expect(actions).not.toContain('transition');
    expect(actions).not.toContain('resume');
  });

  it('always offers duplicate', () => {
    expect(computeEpisodeAvailableActions('COMPLETED')).toContain('duplicate');
    expect(computeEpisodeAvailableActions('REFERRED')).toContain('duplicate');
  });
});
