import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { isApiError } from '../auth/AuthContext';
import type { PatientSummary } from '../types';

const SEX_VALUES = ['MALE', 'FEMALE', 'INDETERMINATE', 'UNKNOWN'];

interface DuplicateWarning {
  status: 'DUPLICATE_WARNING';
  confirmationToken: string;
  potentialMatches: Array<{ lastName: string; dateOfBirth: string; nhsNumberPartial: string; primaryDiagnosisTumourType: string | null }>;
}
interface CreatedResult {
  status: 'CREATED';
  patient: { id: string };
}

export function PatientsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', dateOfBirth: '', sex: 'FEMALE', nhsNumber: '' });
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarning | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadPatients() {
    setLoading(true);
    try {
      const result = await api.get<{ data: PatientSummary[] }>('/patients', { search: search || undefined, limit: 50 });
      setPatients(result.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => void loadPatients(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function submitCreate(duplicateConfirmation?: { token: string; reviewedMatchCount: number; confirmationNote: string }) {
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth,
        sex: form.sex,
        ...(form.nhsNumber && { primaryIdentifier: { identifierType: 'NHS_NUMBER', value: form.nhsNumber } }),
        ...(duplicateConfirmation && { duplicateConfirmation }),
      };
      const result = await api.post<CreatedResult | DuplicateWarning>('/patients', payload);
      if (result.status === 'DUPLICATE_WARNING') {
        setDuplicateWarning(result);
        return;
      }
      setShowCreate(false);
      setDuplicateWarning(null);
      setForm({ firstName: '', lastName: '', dateOfBirth: '', sex: 'FEMALE', nhsNumber: '' });
      navigate(`/patients/${result.patient.id}`);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to create patient');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="top-context">
        <h1>Patients</h1>
        <button className="primary" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? 'Cancel' : '+ Add patient'}
        </button>
      </div>

      {showCreate && (
        <div className="card">
          <h2>New patient</h2>
          {error && <div className="notice notice-error">{error}</div>}
          {duplicateWarning && (
            <div className="notice notice-info">
              <strong>Possible existing patient(s) found.</strong>
              <ul>
                {duplicateWarning.potentialMatches.map((m, i) => (
                  <li key={i}>
                    {m.lastName}, DOB {m.dateOfBirth} — NHS {m.nhsNumberPartial} {m.primaryDiagnosisTumourType && `(${m.primaryDiagnosisTumourType})`}
                  </li>
                ))}
              </ul>
              <button
                onClick={() =>
                  void submitCreate({ token: duplicateWarning.confirmationToken, reviewedMatchCount: duplicateWarning.potentialMatches.length, confirmationNote: 'Reviewed matches, confirmed distinct patient.' })
                }
                disabled={submitting}
              >
                Create anyway
              </button>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitCreate();
            }}
          >
            <div className="form-grid">
              <label className="field">
                <span>First name*</span>
                <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </label>
              <label className="field">
                <span>Last name*</span>
                <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </label>
              <label className="field">
                <span>Date of birth*</span>
                <input required type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              </label>
              <label className="field">
                <span>Sex*</span>
                <select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
                  {SEX_VALUES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>NHS number</span>
                <input value={form.nhsNumber} onChange={(e) => setForm({ ...form, nhsNumber: e.target.value })} />
              </label>
            </div>
            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Create patient'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <input placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 12, width: '100%', maxWidth: 320 }} />
        {loading ? (
          <p className="muted">Loading…</p>
        ) : patients.length === 0 ? (
          <p className="muted">No patients found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>DOB</th>
                <th>Sex</th>
                <th>Identifier</th>
                <th>Diagnosis</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} onClick={() => navigate(`/patients/${p.id}`)} style={{ cursor: 'pointer' }}>
                  <td>
                    <Link to={`/patients/${p.id}`}>
                      {p.lastName}, {p.firstName}
                    </Link>
                  </td>
                  <td>{p.dateOfBirth?.slice(0, 10)}</td>
                  <td>{p.sex}</td>
                  <td>{p.primaryIdentifier ? `${p.primaryIdentifier.identifierType}: ${p.primaryIdentifier.value}` : '—'}</td>
                  <td>{p.primaryDiagnosis ? `${p.primaryDiagnosis.tumourType}${p.primaryDiagnosis.bclcStage ? ` (${p.primaryDiagnosis.bclcStage})` : ''}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
