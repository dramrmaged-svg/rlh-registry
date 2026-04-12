"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = globalSetup;
const child_process_1 = require("child_process");
const pg_1 = require("pg");
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ??
    'postgresql://rlh_test:rlh_test@localhost:5433/rlh_sirt_test';
async function ensureDatabaseExists() {
    const url = new URL(TEST_DATABASE_URL);
    const dbName = url.pathname.slice(1);
    const client = new pg_1.Client({
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
async function globalSetup() {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    process.env.TEST_DATABASE_URL = TEST_DATABASE_URL;
    await ensureDatabaseExists();
    (0, child_process_1.execSync)('pnpm exec prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
        stdio: 'inherit',
    });
}
