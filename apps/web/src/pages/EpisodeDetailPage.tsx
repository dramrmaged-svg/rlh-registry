import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import type { EpisodeDetail } from '../types';
import { StatusTransitionPanel } from '../components/StatusTransitionPanel';
import { DiagnosisPanel } from '../components/DiagnosisPanel';
import { TimelinePanel } from '../components/TimelinePanel';
import { DosimetryPanel } from '../components/DosimetryPanel';
import { TreatmentPanel } from '../components/TreatmentPanel';
import { SimpleListSection } from '../components/SimpleListSection';

const TABS = ['Overview', 'Lesions', 'Mapping', 'Dosimetry', 'Treatment', 'Follow-up', 'Toxicity'] as const;
type Tab = (typeof TABS)[number];

export function EpisodeDetailPage() {
  const { episodeId } = useParams<{ episodeId: string }>();
  const navigate = useNavigate();
  const [episode, setEpisode] = useState<EpisodeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('Overview');
  const [duplicating, setDuplicating] = useState(false);

  async function load() {
    if (!episodeId) return;
    setLoading(true);
    const e = await api.get<EpisodeDetail>(`/episodes/${episodeId}`);
    setEpisode(e);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodeId]);

  async function duplicateEpisode() {
    if (!episodeId) return;
    setDuplicating(true);
    try {
      const copy = await api.post<{ id: string }>(`/episodes/${episodeId}/duplicate`, { copyDiagnosisBasics: true });
      navigate(`/episodes/${copy.id}`);
    } finally {
      setDuplicating(false);
    }
  }

  if (loading || !episode) return <p className="muted">Loading…</p>;

  return (
    <div>
      <div className="top-context">
        <div>
          <h1>Episode {episode.episodeNumber}</h1>
          <div className="meta">
            {episode.firstOrRepeat === 'REPEAT' ? 'Repeat SIRT' : 'First SIRT'} · Created {episode.createdAt.slice(0, 10)}
          </div>
        </div>
        <div className="list-item-actions">
          <Link to={`/patients/${episode.patientId}`}>&larr; Back to patient</Link>
          <button disabled={duplicating} onClick={() => void duplicateEpisode()}>
            Duplicate as new episode
          </button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <>
          <StatusTransitionPanel episode={episode} onUpdated={setEpisode} />
          <DiagnosisPanel episodeId={episode.id} />
          <div className="card">
            <h3>Completeness</h3>
            <table>
              <tbody>
                <tr>
                  <td>Diagnosis recorded</td>
                  <td>{episode.completeness.hasDiagnosis ? 'Yes' : 'No'}</td>
                </tr>
                <tr>
                  <td>MDT records</td>
                  <td>{episode.completeness.mdtRecordCount}</td>
                </tr>
                <tr>
                  <td>Lesions</td>
                  <td>{episode.completeness.lesionCount}</td>
                </tr>
                <tr>
                  <td>Mapping sessions</td>
                  <td>{episode.completeness.mappingSessionCount}</td>
                </tr>
                <tr>
                  <td>Dosimetry plans</td>
                  <td>{episode.completeness.dosimetryPlanCount}</td>
                </tr>
                <tr>
                  <td>Treatment sessions</td>
                  <td>{episode.completeness.treatmentSessionCount}</td>
                </tr>
                <tr>
                  <td>Follow-ups</td>
                  <td>{episode.completeness.followUpCount}</td>
                </tr>
                <tr>
                  <td>Toxicity events</td>
                  <td>{episode.completeness.toxicityEventCount}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <TimelinePanel episodeId={episode.id} />
        </>
      )}

      {tab === 'Lesions' && (
        <SimpleListSection
          title="Lesions"
          listPath={`/episodes/${episode.id}/lesions`}
          createPath={`/episodes/${episode.id}/lesions`}
          fields={[
            { name: 'segment', label: 'Segment', type: 'text' },
            { name: 'laterality', label: 'Laterality', type: 'text' },
            { name: 'diameterAxialMm', label: 'Axial diameter (mm)', type: 'number' },
            { name: 'diameterCraniocaudalMm', label: 'Craniocaudal diameter (mm)', type: 'number' },
            { name: 'lirads', label: 'LI-RADS', type: 'vocab', vocabKey: 'LIRADS' },
          ]}
          columns={[
            { key: 'lesionNumber', label: '#' },
            { key: 'segment', label: 'Segment' },
            { key: 'diameterAxialMm', label: 'Axial (mm)' },
            { key: 'lirads', label: 'LI-RADS' },
          ]}
        />
      )}

      {tab === 'Mapping' && (
        <SimpleListSection
          title="Mapping sessions"
          listPath={`/episodes/${episode.id}/mapping-sessions`}
          createPath={`/episodes/${episode.id}/mapping-sessions`}
          fields={[
            { name: 'sessionDate', label: 'Session date', type: 'date', required: true },
            { name: 'accessRoute', label: 'Access route', type: 'text' },
            { name: 'michelsAnatomy', label: 'Hepatic arterial anatomy', type: 'vocab', vocabKey: 'MICHELS_ANATOMY' },
            { name: 'embolicMaterial', label: 'Embolic material', type: 'vocab', vocabKey: 'EMBOLIC_MATERIAL_MAPPING' },
          ]}
          columns={[
            { key: 'sessionDate', label: 'Date', render: (i) => String(i.sessionDate).slice(0, 10) },
            { key: 'accessRoute', label: 'Access route' },
            { key: 'lockStatus', label: 'Status' },
          ]}
        />
      )}

      {tab === 'Dosimetry' && <DosimetryPanel episodeId={episode.id} />}

      {tab === 'Treatment' && <TreatmentPanel episodeId={episode.id} />}

      {tab === 'Follow-up' && (
        <SimpleListSection
          title="Follow-up assessments"
          listPath={`/episodes/${episode.id}/follow-ups`}
          createPath={`/episodes/${episode.id}/follow-ups`}
          fields={[
            { name: 'followUpDate', label: 'Follow-up date', type: 'date', required: true },
            { name: 'intendedTimepoint', label: 'Intended timepoint', type: 'text' },
            { name: 'visitType', label: 'Visit type', type: 'text' },
            { name: 'overallResponse', label: 'Overall response (RECIST/mRECIST)', type: 'text' },
          ]}
          columns={[
            { key: 'followUpDate', label: 'Date', render: (i) => String(i.followUpDate).slice(0, 10) },
            { key: 'intendedTimepoint', label: 'Timepoint' },
            { key: 'overallResponse', label: 'Response' },
          ]}
        />
      )}

      {tab === 'Toxicity' && (
        <SimpleListSection
          title="Toxicity events"
          listPath={`/episodes/${episode.id}/toxicity-events`}
          createPath={`/episodes/${episode.id}/toxicity-events`}
          fields={[
            { name: 'toxicityType', label: 'Toxicity type', type: 'text', required: true },
            { name: 'onsetDate', label: 'Onset date', type: 'date' },
            { name: 'ctcaeGrade', label: 'CTCAE grade', type: 'number' },
            { name: 'reildGrade', label: 'REILD grade', type: 'vocab', vocabKey: 'REILD_GRADE' },
          ]}
          columns={[
            { key: 'toxicityType', label: 'Type' },
            { key: 'onsetDate', label: 'Onset', render: (i) => (i.onsetDate ? String(i.onsetDate).slice(0, 10) : '—') },
            { key: 'ctcaeGrade', label: 'CTCAE grade' },
          ]}
        />
      )}
    </div>
  );
}
