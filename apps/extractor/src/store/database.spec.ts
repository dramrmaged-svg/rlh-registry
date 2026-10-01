import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ExtractorDatabase, MIGRATIONS, SCHEMA_VERSION } from './database';
import { insertDocument, seededStore } from '../test/helpers';

const MRI_TEXT = 'MRI LIVER 04/03/2026. Segment 7 lesion measures 63 mm. No PVTT.';

function insertFieldValue(store: ExtractorDatabase, episodeId: string, overrides: Record<string, unknown> = {}): string {
  const id = randomUUID();
  const row: Record<string, unknown> = {
    id,
    episode_id: episodeId,
    entity_type: 'tumour_lesion',
    entity_id: 'L1',
    field_key: 'baseline_longest_diameter_mm',
    value_num: 63,
    unit: 'mm',
    source_document_id: null,
    extraction_method: 'MANUAL_ENTRY',
    extractor_version: 'test',
    confidence: 0.9,
    status: 'EXTRACTED',
    ...overrides,
  };
  const cols = Object.keys(row);
  store.db.prepare(`INSERT INTO field_value (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).run(...(Object.values(row) as never[]));
  return id;
}

describe('ExtractorDatabase — schema versioning', () => {
  it('applies all migrations and records the schema version', () => {
    const store = ExtractorDatabase.open(':memory:');
    expect(store.schemaVersion()).toBe(SCHEMA_VERSION);
    expect(SCHEMA_VERSION).toBe(MIGRATIONS.length);
  });

  it('is idempotent across restarts on a file-backed store (application restart)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'extractor-'));
    const path = join(dir, 'store.sqlite');
    try {
      const first = ExtractorDatabase.open(path);
      first.db.prepare('INSERT INTO patient (id, local_key) VALUES (?, ?)').run('p1', 'SYNTH-1');
      first.close();
      const second = ExtractorDatabase.open(path);
      expect(second.schemaVersion()).toBe(SCHEMA_VERSION);
      expect(second.db.prepare('SELECT COUNT(*) AS n FROM patient').get()).toEqual(expect.objectContaining({ n: 1 }));
      second.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuses to open when an applied migration has been edited', () => {
    const store = ExtractorDatabase.open(':memory:');
    store.db.prepare("UPDATE schema_migrations SET checksum = 'tampered' WHERE version = 1").run();
    expect(() => store.migrate()).toThrow(/modified after it was applied/);
  });

  it('refuses to open a database from a newer build', () => {
    const store = ExtractorDatabase.open(':memory:');
    store.db.prepare("INSERT INTO schema_migrations (version, name, checksum, applied_at) VALUES (999, 'future', 'x', 'now')").run();
    expect(() => store.migrate()).toThrow(/newer than this build/);
  });

  it('enforces foreign keys', () => {
    const store = ExtractorDatabase.open(':memory:');
    expect(() => store.db.prepare('INSERT INTO sirt_episode (id, patient_id, episode_number) VALUES (?, ?, 1)').run('e1', 'no-such-patient')).toThrow(/FOREIGN KEY/);
  });

  it('supports multiple episodes, lesions, territories, administrations and follow-ups for one patient', () => {
    const { store, patientId, episodeId } = seededStore();
    store.db.prepare('INSERT INTO sirt_episode (id, patient_id, episode_number, previous_episode_id) VALUES (?, ?, 2, ?)').run('e2', patientId, episodeId);
    for (const label of ['L1', 'L2', 'L3']) store.db.prepare('INSERT INTO tumour_lesion (id, episode_id, lesion_label) VALUES (?, ?, ?)').run(randomUUID(), episodeId, label);
    for (const label of ['RIGHT', 'LEFT']) store.db.prepare('INSERT INTO treatment_territory (id, episode_id, label) VALUES (?, ?, ?)').run(randomUUID(), episodeId, label);
    store.db.prepare('INSERT INTO y90_treatment (id, episode_id, sequence_number) VALUES (?, ?, 1)').run('t1', episodeId);
    store.db.prepare('INSERT INTO y90_treatment (id, episode_id, sequence_number) VALUES (?, ?, 2)').run('t2', episodeId);
    store.db.prepare('INSERT INTO y90_administration (id, y90_treatment_id, position_number) VALUES (?, ?, 1)').run('a1', 't1');
    store.db.prepare('INSERT INTO y90_administration (id, y90_treatment_id, position_number) VALUES (?, ?, 2)').run('a2', 't1');
    for (const d of ['2026-05-01', '2026-08-01', '2026-11-01']) store.db.prepare('INSERT INTO follow_up_episode (id, episode_id, imaging_date) VALUES (?, ?, ?)').run(randomUUID(), episodeId, d);
    const count = (t: string) => Number((store.db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as { n: number }).n);
    expect([count('sirt_episode'), count('tumour_lesion'), count('treatment_territory'), count('y90_treatment'), count('y90_administration'), count('follow_up_episode')]).toEqual([2, 3, 2, 2, 2, 3]);
  });
});

describe('ExtractorDatabase — source evidence is never overwritten', () => {
  it('rejects edits to source_document raw text', () => {
    const { store, episodeId } = seededStore();
    const docId = insertDocument(store, episodeId, MRI_TEXT);
    expect(() => store.db.prepare("UPDATE source_document SET raw_text = 'changed' WHERE id = ?").run(docId)).toThrow(/immutable/);
  });

  it('allows classification / inclusion metadata to change', () => {
    const { store, episodeId } = seededStore();
    const docId = insertDocument(store, episodeId, MRI_TEXT);
    store.db.prepare("UPDATE source_document SET document_class = 'BASELINE_MRI', included = 0, inclusion_reason = 'duplicate of earlier copy' WHERE id = ?").run(docId);
    expect(store.db.prepare('SELECT document_class, included FROM source_document WHERE id = ?').get(docId)).toEqual(expect.objectContaining({ document_class: 'BASELINE_MRI', included: 0 }));
  });

  it('rejects deletion of source documents', () => {
    const { store, episodeId } = seededStore();
    const docId = insertDocument(store, episodeId, MRI_TEXT);
    expect(() => store.db.prepare('DELETE FROM source_document WHERE id = ?').run(docId)).toThrow(/cannot be deleted/);
  });

  it('treats an identical re-capture as the same document (crash-safe idempotency)', () => {
    const { store, episodeId } = seededStore();
    insertDocument(store, episodeId, MRI_TEXT, 1);
    expect(() => insertDocument(store, episodeId, MRI_TEXT, 2)).toThrow(/UNIQUE/);
  });

  it('requires evidence quotes to match the exact source span', () => {
    const { store, episodeId } = seededStore();
    const docId = insertDocument(store, episodeId, MRI_TEXT);
    const start = MRI_TEXT.indexOf('63 mm');
    store.db.prepare('INSERT INTO source_evidence (id, source_document_id, char_start, char_end, quoted_text) VALUES (?, ?, ?, ?, ?)').run('ev1', docId, start, start + 5, '63 mm');
    expect(() =>
      store.db.prepare('INSERT INTO source_evidence (id, source_document_id, char_start, char_end, quoted_text) VALUES (?, ?, ?, ?, ?)').run('ev2', docId, start, start + 5, '58 mm'),
    ).toThrow(/does not match/);
  });
});

describe('ExtractorDatabase — field value provenance invariants', () => {
  it('keeps the original extracted value immutable; verification is recorded alongside it', () => {
    const { store, episodeId } = seededStore();
    const fv = insertFieldValue(store, episodeId);
    expect(() => store.db.prepare('UPDATE field_value SET value_num = 58 WHERE id = ?').run(fv)).toThrow(/immutable/);
    store.db
      .prepare("UPDATE field_value SET status = 'CLINICIAN_VERIFIED', verification_status = 'CORRECTED', verified_value = '58', verification_user = 'dr.synthetic', verification_date = '2026-10-01T10:00:00Z' WHERE id = ?")
      .run(fv);
    expect(store.db.prepare('SELECT value_num, verified_value FROM field_value WHERE id = ?').get(fv)).toEqual(expect.objectContaining({ value_num: 63, verified_value: '58' }));
  });

  it('refuses CLINICIAN_VERIFIED without a named user and timestamp', () => {
    const { store, episodeId } = seededStore();
    const fv = insertFieldValue(store, episodeId);
    expect(() => store.db.prepare("UPDATE field_value SET status = 'CLINICIAN_VERIFIED' WHERE id = ?").run(fv)).toThrow(/CHECK/);
  });

  it('refuses AI_INFERRED values with no linked AI interpretation', () => {
    const { store, episodeId } = seededStore();
    expect(() => insertFieldValue(store, episodeId, { status: 'AI_INFERRED', extraction_method: 'AI_SUGGESTION' })).toThrow(/CHECK/);
  });

  it('refuses AI suggestions masquerading as extracted values', () => {
    const { store, episodeId } = seededStore();
    expect(() => insertFieldValue(store, episodeId, { status: 'EXTRACTED', extraction_method: 'AI_SUGGESTION' })).toThrow(/CHECK/);
  });

  it('refuses CALCULATED values with no calculation run', () => {
    const { store, episodeId } = seededStore();
    expect(() => insertFieldValue(store, episodeId, { status: 'CALCULATED', extraction_method: 'CALCULATION' })).toThrow(/CHECK/);
  });

  it('refuses text-rule extraction without a source document', () => {
    const { store, episodeId } = seededStore();
    expect(() => insertFieldValue(store, episodeId, { extraction_method: 'DIRECT_TEXT_RULE' })).toThrow(/CHECK/);
  });

  it('caps OCR-derived confidence at 0.6', () => {
    const { store, episodeId } = seededStore();
    const docId = insertDocument(store, episodeId, MRI_TEXT);
    expect(() => insertFieldValue(store, episodeId, { extraction_method: 'OCR_RULE', source_document_id: docId, confidence: 0.95 })).toThrow(/CHECK/);
    expect(() => insertFieldValue(store, episodeId, { extraction_method: 'OCR_RULE', source_document_id: docId, confidence: 0.6 })).not.toThrow();
  });

  it('forbids deleting field values', () => {
    const { store, episodeId } = seededStore();
    const fv = insertFieldValue(store, episodeId);
    expect(() => store.db.prepare('DELETE FROM field_value WHERE id = ?').run(fv)).toThrow(/cannot be deleted/);
  });

  it('keeps clinician_verification and audit_event append-only', () => {
    const { store, episodeId } = seededStore();
    const fv = insertFieldValue(store, episodeId);
    store.db
      .prepare("INSERT INTO clinician_verification (id, field_value_id, action, previous_value, new_value, verification_user, verification_timestamp) VALUES ('v1', ?, 'VERIFY', '63', '63', 'dr.synthetic', '2026-10-01T10:00:00Z')")
      .run(fv);
    expect(() => store.db.prepare("UPDATE clinician_verification SET new_value = '1' WHERE id = 'v1'").run()).toThrow(/append-only/);
    expect(() => store.db.prepare("DELETE FROM clinician_verification WHERE id = 'v1'").run()).toThrow(/append-only/);
    store.db.prepare("INSERT INTO audit_event (id, occurred_at, actor, action, entity_type) VALUES ('a1', 'now', 'system', 'TEST', 'field_value')").run();
    expect(() => store.db.prepare("DELETE FROM audit_event WHERE id = 'a1'").run()).toThrow(/append-only/);
  });

  it('requires a substantive reason for a correction', () => {
    const { store, episodeId } = seededStore();
    const fv = insertFieldValue(store, episodeId);
    expect(() =>
      store.db
        .prepare("INSERT INTO clinician_verification (id, field_value_id, action, new_value, reason, verification_user, verification_timestamp) VALUES ('v2', ?, 'CORRECT', '58', 'typo', 'dr.synthetic', 'now')")
        .run(fv),
    ).toThrow(/CHECK/);
  });

  it('allows at most one open conflict per field', () => {
    const { store, episodeId } = seededStore();
    const ins = "INSERT INTO conflict (id, episode_id, entity_type, entity_id, field_key, candidate_field_value_ids, state) VALUES (?, ?, 'tumour_lesion', 'L1', 'baseline_longest_diameter_mm', '[]', 'OPEN')";
    store.db.prepare(ins).run('c1', episodeId);
    expect(() => store.db.prepare(ins).run('c2', episodeId)).toThrow(/UNIQUE/);
  });

  it('forces every AI interpretation to carry the clinician-review label', () => {
    const { store, episodeId } = seededStore();
    const ins = `INSERT INTO ai_interpretation (id, episode_id, task, provider, model, prompt_sha256, input_field_value_ids, pseudonymised, output_text, label)
                 VALUES (?, ?, 'SUMMARY', 'none', 'none', 'x', '[]', 1, 'text', ?)`;
    expect(() => store.db.prepare(ins).run('ai1', episodeId, 'REVIEWED')).toThrow(/CHECK/);
    expect(() => store.db.prepare(ins).run('ai2', episodeId, 'AI_GENERATED_CLINICIAN_REVIEW_REQUIRED')).not.toThrow();
  });
});
