"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueToken = issueToken;
exports.validateAndConsumeToken = validateAndConsumeToken;
const crypto_1 = require("crypto");
const DUPLICATE_TOKEN_TTL_MS = 10 * 60 * 1000;
const store = new Map();
function hashPayload(params) {
    const normalized = { firstName: params.firstName.trim().toLowerCase(), lastName: params.lastName.trim().toLowerCase(), dateOfBirth: new Date(params.dateOfBirth).toISOString().slice(0, 10), nhsNumber: (params.nhsNumber ?? '').replace(/\D/g, '') };
    return (0, crypto_1.createHash)('sha256').update(JSON.stringify(normalized)).digest('hex');
}
function issueToken(payload) {
    const payloadHash = hashPayload(payload);
    const token = 'dup_' + (0, crypto_1.createHash)('sha256').update(`${Date.now()}${Math.random()}`).digest('hex').slice(0, 24);
    const expiresAt = Date.now() + DUPLICATE_TOKEN_TTL_MS;
    store.set(token, { payloadHash, expiresAt, reviewedMatchCount: payload.reviewedMatchCount });
    for (const [k, v] of store.entries()) {
        if (v.expiresAt < Date.now())
            store.delete(k);
    }
    return { token, expiresAt: new Date(expiresAt) };
}
function validateAndConsumeToken(token, incomingPayload) {
    const record = store.get(token);
    if (!record)
        return null;
    if (record.expiresAt < Date.now()) {
        store.delete(token);
        return null;
    }
    if (hashPayload(incomingPayload) !== record.payloadHash)
        return null;
    store.delete(token);
    return { reviewedMatchCount: record.reviewedMatchCount };
}
