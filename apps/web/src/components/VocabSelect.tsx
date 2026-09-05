import { useVocabulary } from '../vocab/useVocabulary';

interface VocabSelectProps {
  vocabKey: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
}

/**
 * A genuinely locked <select> sourced from the backend's vocabulary API —
 * deliberately not a freetext-overridable combobox. The legacy app's
 * "controlled" dropdowns were all freetext-overridable comboboxes, which the
 * Phase 1 audit flagged as defeating standardisation; the backend's
 * @IsVocabularyCode() validator already rejects out-of-list values, so the
 * UI should not offer a way to submit one.
 */
export function VocabSelect({ vocabKey, value, onChange, label, required }: VocabSelectProps) {
  const { options, loading } = useVocabulary(vocabKey);
  return (
    <label className="field">
      <span>
        {label}
        {required && <span className="required">*</span>}
      </span>
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={loading} required={required}>
        <option value="">{loading ? 'Loading…' : '— Select —'}</option>
        {options.map((o) => (
          <option key={o.code} value={o.code}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
