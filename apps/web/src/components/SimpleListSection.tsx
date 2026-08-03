import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { isApiError } from '../auth/AuthContext';
import { VocabSelect } from './VocabSelect';

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'checkbox' | 'vocab';
  vocabKey?: string;
  required?: boolean;
}

function FieldInput({ field, value, onChange }: { field: FieldConfig; value: unknown; onChange: (v: unknown) => void }) {
  if (field.type === 'vocab') {
    return <VocabSelect vocabKey={field.vocabKey!} value={(value as string) ?? ''} onChange={onChange} label={field.label} required={field.required} />;
  }
  if (field.type === 'checkbox') {
    return (
      <label className="field">
        <span>{field.label}</span>
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} style={{ width: 18, height: 18 }} />
      </label>
    );
  }
  return (
    <label className="field">
      <span>
        {field.label}
        {field.required && <span className="required">*</span>}
      </span>
      <input
        type={field.type}
        required={field.required}
        value={(value as string | number | undefined) ?? ''}
        onChange={(e) => onChange(field.type === 'number' ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value)}
      />
    </label>
  );
}

interface Column {
  key: string;
  label: string;
  render?: (item: Record<string, unknown>) => string;
}

interface SimpleListSectionProps {
  title: string;
  listPath: string;
  createPath: string;
  fields: FieldConfig[];
  columns: Column[];
  emptyMessage?: string;
}

export function SimpleListSection({ title, listPath, createPath, fields, columns, emptyMessage }: SimpleListSectionProps) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    const result = await api.get<Record<string, unknown>[]>(listPath);
    setItems(result);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listPath]);

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const cleaned = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined && v !== ''));
      await api.post(createPath, cleaned);
      setValues({});
      setShowForm(false);
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <div className="top-context" style={{ marginBottom: 8 }}>
        <h3>{title}</h3>
        <button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : '+ Add'}</button>
      </div>

      {showForm && (
        <div style={{ marginBottom: 12 }}>
          {error && <div className="notice notice-error">{error}</div>}
          <div className="form-grid">
            {fields.map((f) => (
              <FieldInput key={f.name} field={f} value={values[f.name]} onChange={(v) => setValues((prev) => ({ ...prev, [f.name]: v }))} />
            ))}
          </div>
          <button className="primary" disabled={submitting} onClick={() => void submit()}>
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : items.length === 0 ? (
        <p className="muted">{emptyMessage ?? 'None recorded yet.'}</p>
      ) : (
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={(item.id as string) ?? i}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(item) : String(item[c.key] ?? '—')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
