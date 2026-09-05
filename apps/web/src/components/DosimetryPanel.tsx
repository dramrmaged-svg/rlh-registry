import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { isApiError } from '../auth/AuthContext';
import { VocabSelect } from './VocabSelect';

interface DosimetryPlan {
  id: string;
  planDate: string;
  planningModel: string;
  confirmedPrescribedActivityGbq: string | null;
  lockStatus: string;
  approvedAt: string | null;
  version: number;
}

export function DosimetryPanel({ episodeId }: { episodeId: string }) {
  const [plans, setPlans] = useState<DosimetryPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [planDate, setPlanDate] = useState('');
  const [planningModel, setPlanningModel] = useState('');
  const [activity, setActivity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    const result = await api.get<DosimetryPlan[]>(`/episodes/${episodeId}/dosimetry-plans`);
    setPlans(result);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodeId]);

  async function create() {
    setError(null);
    setSubmitting(true);
    try {
      await api.post(`/episodes/${episodeId}/dosimetry-plans`, {
        planDate,
        planningModel,
        ...(activity && { confirmedPrescribedActivityGbq: Number(activity) }),
      });
      setShowForm(false);
      setPlanDate('');
      setPlanningModel('');
      setActivity('');
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  async function approve(id: string) {
    setError(null);
    try {
      await api.post(`/dosimetry-plans/${id}/approve`);
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to approve');
    }
  }

  return (
    <div className="card">
      <div className="top-context" style={{ marginBottom: 8 }}>
        <h3>Dosimetry plans</h3>
        <button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : '+ Add'}</button>
      </div>
      {error && <div className="notice notice-error">{error}</div>}
      {showForm && (
        <div style={{ marginBottom: 12 }}>
          <div className="form-grid">
            <label className="field">
              <span>Plan date*</span>
              <input type="date" required value={planDate} onChange={(e) => setPlanDate(e.target.value)} />
            </label>
            <VocabSelect vocabKey="PLANNING_MODEL" value={planningModel} onChange={setPlanningModel} label="Planning model" required />
            <label className="field">
              <span>Confirmed prescribed activity (GBq)</span>
              <input type="number" step="0.01" value={activity} onChange={(e) => setActivity(e.target.value)} />
            </label>
          </div>
          <button className="primary" disabled={!planDate || !planningModel || submitting} onClick={() => void create()}>
            Save
          </button>
        </div>
      )}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : plans.length === 0 ? (
        <p className="muted">No dosimetry plans yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Model</th>
              <th>Prescribed activity (GBq)</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id}>
                <td>{p.planDate.slice(0, 10)}</td>
                <td>{p.planningModel}</td>
                <td>{p.confirmedPrescribedActivityGbq ?? '—'}</td>
                <td>
                  {p.approvedAt ? <span className="badge badge-success">Approved</span> : <span className="badge badge-status">{p.lockStatus}</span>}
                </td>
                <td>{!p.approvedAt && <button onClick={() => void approve(p.id)}>Approve</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
