import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { isApiError } from '../auth/AuthContext';
import { VocabSelect } from './VocabSelect';

interface Diagnosis {
  id: string;
  tumourType: string;
  aetiology: string | null;
  confirmedBclcStage: string | null;
  calculatedBclcStage: string | null;
  confirmedCpGrade: string | null;
  calculatedCpGrade: string | null;
  calculatedCpScore: number | null;
  calculatedMeld3Score: string | null;
  calculatedMeldNaScore: string | null;
  calculatedAlbiScore: string | null;
  calculatedAlbiGrade: number | null;
  version: number;
}

interface CalcInputs {
  bilirubinUmolL?: number;
  albuminGL?: number;
  inr?: number;
  creatinineUmolL?: number;
  sodiumMmolL?: number;
  ecogScore?: number;
  tumourCount?: number;
  largestDiameterCm?: number;
  pvtt?: string;
  extrahepaticSpread?: boolean;
  ascites?: string;
  encephalopathy?: string;
}

export function DiagnosisPanel({ episodeId }: { episodeId: string }) {
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tumourType, setTumourType] = useState('');
  const [calc, setCalc] = useState<CalcInputs>({});
  const [calcResults, setCalcResults] = useState<Array<{ formulaId: string; status: string; explanation: string }>>([]);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const d = await api.get<Diagnosis>(`/episodes/${episodeId}/diagnosis`);
      setDiagnosis(d);
    } catch (err) {
      if (isApiError(err) && err.status === 404) setDiagnosis(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodeId]);

  async function createDiagnosis() {
    setError(null);
    setSubmitting(true);
    try {
      const d = await api.post<Diagnosis>(`/episodes/${episodeId}/diagnosis`, { tumourType });
      setDiagnosis(d);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to create diagnosis');
    } finally {
      setSubmitting(false);
    }
  }

  async function recalculate() {
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      const cleaned = Object.fromEntries(Object.entries(calc).filter(([, v]) => v !== undefined && v !== ''));
      const result = await api.post<{ diagnosis: Diagnosis; calculations: Array<{ formulaId: string; status: string; explanation: string }> }>(`/episodes/${episodeId}/diagnosis/recalculate`, cleaned);
      setDiagnosis(result.diagnosis);
      setCalcResults(result.calculations);
      setNotice('Calculations updated.');
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to recalculate');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="card">Loading diagnosis…</div>;

  if (!diagnosis) {
    return (
      <div className="card">
        <h3>Diagnosis</h3>
        {error && <div className="notice notice-error">{error}</div>}
        <div className="form-grid">
          <VocabSelect vocabKey="DIAGNOSIS_TUMOUR_TYPE" value={tumourType} onChange={setTumourType} label="Tumour type" required />
        </div>
        <button className="primary" disabled={!tumourType || submitting} onClick={() => void createDiagnosis()}>
          Create diagnosis
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Diagnosis &amp; staging</h3>
      {error && <div className="notice notice-error">{error}</div>}
      {notice && <div className="notice notice-info">{notice}</div>}
      <p>
        <strong>{diagnosis.tumourType}</strong>
        {diagnosis.aetiology && ` · ${diagnosis.aetiology}`}
      </p>
      <table style={{ marginBottom: 16 }}>
        <thead>
          <tr>
            <th></th>
            <th>Calculated</th>
            <th>Confirmed</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>BCLC</td>
            <td>{diagnosis.calculatedBclcStage ?? '—'}</td>
            <td>{diagnosis.confirmedBclcStage ?? '—'}</td>
          </tr>
          <tr>
            <td>Child-Pugh</td>
            <td>{diagnosis.calculatedCpGrade ? `${diagnosis.calculatedCpGrade} (${diagnosis.calculatedCpScore})` : '—'}</td>
            <td>{diagnosis.confirmedCpGrade ?? '—'}</td>
          </tr>
          <tr>
            <td>MELD-3.0</td>
            <td colSpan={2}>{diagnosis.calculatedMeld3Score ?? '—'}</td>
          </tr>
          <tr>
            <td>MELD-Na</td>
            <td colSpan={2}>{diagnosis.calculatedMeldNaScore ?? '—'}</td>
          </tr>
          <tr>
            <td>ALBI</td>
            <td colSpan={2}>{diagnosis.calculatedAlbiScore ? `${Number(diagnosis.calculatedAlbiScore).toFixed(3)} (Grade ${diagnosis.calculatedAlbiGrade})` : '—'}</td>
          </tr>
        </tbody>
      </table>

      <details>
        <summary style={{ cursor: 'pointer', marginBottom: 8 }}>Recalculate from clinical inputs</summary>
        <div className="form-grid" style={{ marginTop: 8 }}>
          <label className="field">
            <span>Bilirubin (µmol/L)</span>
            <input type="number" value={calc.bilirubinUmolL ?? ''} onChange={(e) => setCalc({ ...calc, bilirubinUmolL: e.target.value ? Number(e.target.value) : undefined })} />
          </label>
          <label className="field">
            <span>Albumin (g/L)</span>
            <input type="number" value={calc.albuminGL ?? ''} onChange={(e) => setCalc({ ...calc, albuminGL: e.target.value ? Number(e.target.value) : undefined })} />
          </label>
          <label className="field">
            <span>INR</span>
            <input type="number" step="0.01" value={calc.inr ?? ''} onChange={(e) => setCalc({ ...calc, inr: e.target.value ? Number(e.target.value) : undefined })} />
          </label>
          <label className="field">
            <span>Creatinine (µmol/L)</span>
            <input type="number" value={calc.creatinineUmolL ?? ''} onChange={(e) => setCalc({ ...calc, creatinineUmolL: e.target.value ? Number(e.target.value) : undefined })} />
          </label>
          <label className="field">
            <span>Sodium (mmol/L)</span>
            <input type="number" value={calc.sodiumMmolL ?? ''} onChange={(e) => setCalc({ ...calc, sodiumMmolL: e.target.value ? Number(e.target.value) : undefined })} />
          </label>
          <label className="field">
            <span>ECOG</span>
            <input type="number" min={0} max={4} value={calc.ecogScore ?? ''} onChange={(e) => setCalc({ ...calc, ecogScore: e.target.value ? Number(e.target.value) : undefined })} />
          </label>
          <label className="field">
            <span>Tumour count</span>
            <input type="number" value={calc.tumourCount ?? ''} onChange={(e) => setCalc({ ...calc, tumourCount: e.target.value ? Number(e.target.value) : undefined })} />
          </label>
          <label className="field">
            <span>Largest lesion (cm)</span>
            <input type="number" step="0.1" value={calc.largestDiameterCm ?? ''} onChange={(e) => setCalc({ ...calc, largestDiameterCm: e.target.value ? Number(e.target.value) : undefined })} />
          </label>
          <VocabSelect vocabKey="PVTT" value={calc.pvtt ?? ''} onChange={(v) => setCalc({ ...calc, pvtt: v })} label="PVTT" />
          <label className="field">
            <span>Extrahepatic spread</span>
            <input type="checkbox" checked={Boolean(calc.extrahepaticSpread)} onChange={(e) => setCalc({ ...calc, extrahepaticSpread: e.target.checked })} style={{ width: 18, height: 18 }} />
          </label>
          <label className="field">
            <span>Ascites</span>
            <input placeholder="None / Mild / Moderate" value={calc.ascites ?? ''} onChange={(e) => setCalc({ ...calc, ascites: e.target.value })} />
          </label>
          <label className="field">
            <span>Encephalopathy</span>
            <input placeholder="None / Grade 1-2 / Grade 3-4" value={calc.encephalopathy ?? ''} onChange={(e) => setCalc({ ...calc, encephalopathy: e.target.value })} />
          </label>
        </div>
        <button className="primary" disabled={submitting} onClick={() => void recalculate()}>
          {submitting ? 'Calculating…' : 'Recalculate'}
        </button>
        {calcResults.length > 0 && (
          <ul style={{ marginTop: 8, fontSize: 12 }} className="muted">
            {calcResults.map((r) => (
              <li key={r.formulaId}>
                {r.formulaId}: {r.status} — {r.explanation}
              </li>
            ))}
          </ul>
        )}
      </details>
    </div>
  );
}
