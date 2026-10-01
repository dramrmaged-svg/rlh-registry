import { createHash, randomUUID } from 'node:crypto';
import { ExtractorDatabase } from '../store/database';

export function sha256(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

/** Fresh in-memory store with one synthetic patient + episode. No real identifiers. */
export function seededStore(): { store: ExtractorDatabase; patientId: string; episodeId: string } {
  const store = ExtractorDatabase.open(':memory:');
  const patientId = randomUUID();
  const episodeId = randomUUID();
  store.db.prepare('INSERT INTO patient (id, local_key) VALUES (?, ?)').run(patientId, 'SYNTH-0001');
  store.db.prepare('INSERT INTO sirt_episode (id, patient_id, episode_number) VALUES (?, ?, 1)').run(episodeId, patientId);
  return { store, patientId, episodeId };
}

export function insertDocument(store: ExtractorDatabase, episodeId: string, text: string, order = 1): string {
  const id = randomUUID();
  store.db
    .prepare(
      `INSERT INTO source_document (id, episode_id, source_order, title, capture_method, raw_text, text_sha256, normalised_sha256, captured_at)
       VALUES (?, ?, ?, ?, 'DIRECT_TEXT_COPY', ?, ?, ?, ?)`,
    )
    .run(id, episodeId, order, 'MRI LIVER', text, sha256(text), sha256(text.replace(/\s+/g, ' ').trim()), new Date().toISOString());
  return id;
}
