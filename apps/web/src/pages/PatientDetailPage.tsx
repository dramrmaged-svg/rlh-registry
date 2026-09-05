import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { isApiError } from '../auth/AuthContext';
import type { EpisodeSummary, PatientDetail } from '../types';

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [repeatOf, setRepeatOf] = useState('');

  async function load() {
    if (!patientId) return;
    setLoading(true);
    const [p, e] = await Promise.all([api.get<PatientDetail>(`/patients/${patientId}`), api.get<EpisodeSummary[]>(`/patients/${patientId}/episodes`)]);
    setPatient(p);
    setEpisodes(e);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  async function createEpisode(firstOrRepeat: 'FIRST' | 'REPEAT') {
    if (!patientId) return;
    setError(null);
    setCreating(true);
    try {
      const payload = firstOrRepeat === 'REPEAT' ? { firstOrRepeat, previousEpisodeId: repeatOf } : { firstOrRepeat };
      const episode = await api.post<{ id: string }>(`/patients/${patientId}/episodes`, payload);
      navigate(`/episodes/${episode.id}`);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to create episode');
    } finally {
      setCreating(false);
    }
  }

  if (loading || !patient) return <p className="muted">Loading…</p>;

  return (
    <div>
      <div className="top-context">
        <div>
          <h1>
            {patient.lastName}, {patient.firstName}
          </h1>
          <div className="meta">
            DOB {patient.dateOfBirth.slice(0, 10)} (age {calculateAge(patient.dateOfBirth)}) · {patient.sex}
            {patient.identifiers[0] && ` · ${patient.identifiers[0].identifierType}: ${patient.identifiers[0].value}`}
          </div>
        </div>
        <Link to="/patients">&larr; Back to patients</Link>
      </div>

      {error && <div className="notice notice-error">{error}</div>}

      <div className="card">
        <div className="top-context" style={{ marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Episodes</h2>
          <div className="list-item-actions">
            <button className="primary" disabled={creating} onClick={() => void createEpisode('FIRST')}>
              + First SIRT episode
            </button>
          </div>
        </div>

        {episodes.length > 1 || episodes.length > 0 ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <select value={repeatOf} onChange={(e) => setRepeatOf(e.target.value)}>
              <option value="">— select an episode to repeat —</option>
              {episodes.map((e) => (
                <option key={e.id} value={e.id}>
                  Episode {e.episodeNumber} ({e.status})
                </option>
              ))}
            </select>
            <button disabled={!repeatOf || creating} onClick={() => void createEpisode('REPEAT')}>
              + Repeat SIRT episode
            </button>
          </div>
        ) : null}

        {episodes.length === 0 ? (
          <p className="muted">No episodes yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Type</th>
                <th>Status</th>
                <th>Referral date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {episodes.map((e) => (
                <tr key={e.id}>
                  <td>{e.episodeNumber}</td>
                  <td>{e.firstOrRepeat}</td>
                  <td>
                    <span className="badge badge-status">{e.status}</span>
                  </td>
                  <td>{e.referralDate?.slice(0, 10) ?? '—'}</td>
                  <td>
                    <Link to={`/episodes/${e.id}`}>Open →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
