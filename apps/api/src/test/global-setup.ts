import { execSync } from 'child_process';
import { Client } from 'pg';

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://rlh_test:rlh_test@localhost:5433/rlh_sirt_test';

async function ensureDatabaseExists(): Promise<void> {
  const url = new URL(TEST_DATABASE_URL);
  const dbName = url.pathname.slice(1);
  const client = new Client({
    host: url.hostname,
    port: Number(url.port),
    user: url.username,
    password: url.password,
    database: 'postgres',
  });
  await client.connect();
  const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if ((result.rowCount ?? 0) === 0) {
    await client.query(`CREATE DATABASE "${dbName}"`);
  }
  await client.end();
}

export default async function globalSetup(): Promise<void> {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  process.env.TEST_DATABASE_URL = TEST_DATABASE_URL;
  await ensureDatabaseExists();
  execSync('pnpm exec prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'inherit',
  });
}
