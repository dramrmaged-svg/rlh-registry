import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { isApiError } from '../auth/AuthContext';
import type { ReadinessFinding } from '../types';

interface TreatmentSession {
  id: string;
  sessionDate: string;
  sessionNumber: number;
  administeredActivityGbq: string | null;
  lockStatus: string;
}

export function TreatmentPanel({ episodeId }: { episodeId: string }) {
  const [sessions, setSessions] = useState<TreatmentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sessionDate, setSessionDate] = useState('');
  const [activity, setActivity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [findings, setFindings] = useState<ReadinessFinding[]>([]);
  const [overrideReason, setOverrideReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    const result = await api.get<TreatmentSession[]>(`/episodes/${episodeId}/treatment-sessions`);
    setSessions(result);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodeId]);

  async function create(overrideWarnings?: Array<{ code: string; reason: string }>) {
    setError(null);
    setSubmitting(true);
    try {
      await api.post(`/episodes/${episodeId}/treatment-sessions`, {
        sessionDate,
        ...(activity && { administeredActivityGbq: Number(activity) }),
        ...(overrideWarnings && { overrideWarnings }),
      });
      setShowForm(false);
      setSessionDate('');
      setActivity('');
      setFindings([]);
      setOverrideReason('');
      await load();
    } catch (err) {
      if (isApiError(err) && err.code === 'READINESS_CHECK_FAILED') {
        setFindings((err.details as { findings: ReadinessFinding[] }).findings);
      } else {
        setError(isApiError(err) ? err.message : 'Failed to save');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const hasBlock = findings.some((f) => f.severity === 'BLOCK');
  const warnings = findings.filter((f) => f.severity === 'WARNING');

  return (
    <div className="card">
      <div className="top-context" style={{ marginBottom: 8 }}>
        <h3>Treatment sessions</h3>
        <button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : '+ Add'}</button>
      </div>
      {error && <div className="notice notice-error">{error}</div>}
      {showForm && (
        <div style={{ marginBottom: 12 }}>
          <div className="form-grid">
            <label className="field">
              <span>Session date*</span>
              <input type="date" required value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
            </label>
            <label className="field">
              <span>Administered activity (GBq)</span>
              <input type="number" step="0.01" value={activity} onChange={(e) => setActivity(e.target.value)} />
            </label>
          </div>
          <button className="primary" disabled={!sessionDate || submitting} onClick={() => void create()}>
            Save
          </button>
          {findings.length > 0 && (
            <div className="notice notice-error" style={{ marginTop: 12 }}>
              <strong>Cannot proceed until resolved:</strong>
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
                  <button disabled={overrideReason.trim().length < 10 || submitting} onClick={() => void create(warnings.map((w) => ({ code: w.code, reason: overrideReason })))}>
                    Override and proceed
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : sessions.length === 0 ? (
        <p className="muted">No treatment sessions yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Administered activity (GBq)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>{s.sessionNumber}</td>
                <td>{s.sessionDate.slice(0, 10)}</td>
                <td>{s.administeredActivityGbq ?? '—'}</td>
                <td>
                  <span className="badge badge-status">{s.lockStatus}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
