import { PrismaClient } from '@prisma/client';

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  'postgresql://rlh_test:rlh_test@localhost:5433/rlh_sirt_test';

export function createTestClient(): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: TEST_DATABASE_URL } },
    log: process.env.DEBUG_SQL ? ['query'] : [],
  });
}

const TABLES = [
  'audit_logs', 'refresh_tokens', 'calculation_audits', 'toxicity_events',
  'follow_ups', 'lesion_dose_injections', 'lesion_feeders', 'lesions',
  'treatment_sessions', 'dosimetry_plans', 'maa_studies', 'mapping_sessions',
  'episode_outcomes', 'imaging_studies', 'clinical_snapshots',
  'clinical_scores', 'lab_panels', 'diagnoses', 'mdt_records', 'episodes',
  'mdt_sessions', 'vocabulary_options', 'vocabularies', 'patient_identifiers',
  'patients', 'users',
].join('", "');

export async function truncateAll(client: PrismaClient): Promise<void> {
  await client.$executeRawUnsafe(`TRUNCATE TABLE "${TABLES}" RESTART IDENTITY CASCADE`);
}
