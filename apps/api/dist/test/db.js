"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestClient = createTestClient;
exports.truncateAll = truncateAll;
const client_1 = require("@prisma/client");
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ??
    process.env.DATABASE_URL ??
    'postgresql://rlh_test:rlh_test@localhost:5433/rlh_sirt_test';
function createTestClient() {
    return new client_1.PrismaClient({
        datasources: { db: { url: TEST_DATABASE_URL } },
        log: process.env.DEBUG_SQL ? ['query'] : [],
    });
}
const TABLES = [
    'audit_logs', 'refresh_tokens', 'mdt_records', 'clinical_snapshots',
    'clinical_scores', 'lab_panels', 'patient_identifiers', 'diagnoses',
    'follow_ups', 'procedures', 'treatment_courses', 'imaging_studies',
    'mdt_sessions', 'patients', 'users',
].join('", "');
async function truncateAll(client) {
    await client.$executeRawUnsafe(`TRUNCATE TABLE "${TABLES}" RESTART IDENTITY CASCADE`);
}
