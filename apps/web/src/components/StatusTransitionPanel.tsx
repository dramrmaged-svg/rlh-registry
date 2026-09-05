import { useState } from 'react';
import { api } from '../api/client';
import { isApiError } from '../auth/AuthContext';
import type { EpisodeDetail, ReadinessFinding } from '../types';

const ALL_STATUSES = [
  'REFERRED', 'AWAITING_MDT', 'MDT_APPROVED', 'CLINIC_ASSESSMENT_COMPLETED', 'AWAITING_MAPPING',
  'MAPPING_COMPLETED', 'AWAITING_DOSIMETRY', 'TREATMENT_APPROVED', 'AWAITING_TREATMENT', 'TREATMENT_COMPLETED',
  'EARLY_FOLLOW_UP', 'IMAGING_FOLLOW_UP', 'COMPLETED', 'CANCELLED', 'DEFERRED', 'NOT_SUITABLE', 'LOST_TO_FOLLOW_UP',
];

export function StatusTransitionPanel({ episode, onUpdated }: { episode: EpisodeDetail; onUpdated: (e: EpisodeDetail) => void }) {
  const [toStatus, setToStatus] = useState('');
  const [findings, setFindings] = useState<ReadinessFinding[]>([]);
  const [overrideReason, setOverrideReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function transition(overrideWarnings?: Array<{ code: string; reason: string }>) {
    setError(null);
    setSubmitting(true);
    try {
      const result = await api.post<{ record: EpisodeDetail; alreadyInState: boolean }>(`/episodes/${episode.id}/transition`, {
        toStatus,
        version: episode.version,
        ...(overrideWarnings && { overrideWarnings }),
      });
      onUpdated(result.record);
      setFindings([]);
      setToStatus('');
      setOverrideReason('');
    } catch (err) {
      if (isApiError(err) && err.code === 'READINESS_CHECK_FAILED') {
        const details = err.details as { findings: ReadinessFinding[] };
        setFindings(details.findings);
      } else {
        setError(isApiError(err) ? err.message : 'Transition failed');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function resume() {
    setError(null);
    setSubmitting(true);
    try {
      const result = await api.post<{ record: EpisodeDetail }>(`/episodes/${episode.id}/resume`, { version: episode.version });
      onUpdated(result.record);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to resume');
    } finally {
      setSubmitting(false);
    }
  }

  const hasBlock = findings.some((f) => f.severity === 'BLOCK');
  const warnings = findings.filter((f) => f.severity === 'WARNING');

  return (
    <div className="card">
      <h3>Status</h3>
      <p>
        <span className="badge badge-status">{episode.status}</span>
      </p>
      {error && <div className="notice notice-error">{error}</div>}

      {episode.status === 'DEFERRED' ? (
        <button className="primary" disabled={submitting} onClick={() => void resume()}>
          Resume ({episode.deferredFromStatus})
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <select value={toStatus} onChange={(e) => { setToStatus(e.target.value); setFindings([]); }}>
            <option value="">— select new status —</option>
            {ALL_STATUSES.filter((s) => s !== episode.status).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button className="primary" disabled={!toStatus || submitting} onClick={() => void transition()}>
            Transition
          </button>
        </div>
      )}

      {findings.length > 0 && (
        <div className="notice notice-error" style={{ marginTop: 12 }}>
          <strong>This transition cannot proceed until resolved:</strong>
          <ul>
            {findings.map((f) => (
              <li key={f.code}>
                <span className={`badge ${f.severity === 'BLOCK' ? 'badge-block' : 'badge-warning'}`}>{f.severity}</span> {f.message}
              </li>
            ))}
          </ul>
          {!hasBlock && warnings.length > 0 && (
            <div>
              <label className="field">
                <span>Override reason (min. 10 characters)</span>
                <textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
              </label>
              <button
                disabled={overrideReason.trim().length < 10 || submitting}
                onClick={() => void transition(warnings.map((w) => ({ code: w.code, reason: overrideReason })))}
              >
                Override and proceed
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
