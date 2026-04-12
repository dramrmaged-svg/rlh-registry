import { createHash } from 'crypto';

export interface DuplicateTokenPayload {
  firstName: string; lastName: string; dateOfBirth: string; nhsNumber?: string;
}

interface TokenRecord { payloadHash: string; expiresAt: number; reviewedMatchCount: number; }

const DUPLICATE_TOKEN_TTL_MS = 10 * 60 * 1000;
const store = new Map<string, TokenRecord>();

function hashPayload(params: DuplicateTokenPayload): string {
  const normalized = { firstName: params.firstName.trim().toLowerCase(), lastName: params.lastName.trim().toLowerCase(), dateOfBirth: new Date(params.dateOfBirth).toISOString().slice(0, 10), nhsNumber: (params.nhsNumber ?? '').replace(/\D/g, '') };
  return createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

export function issueToken(payload: DuplicateTokenPayload & { reviewedMatchCount: number }): { token: string; expiresAt: Date } {
  const payloadHash = hashPayload(payload);
  const token = 'dup_' + createHash('sha256').update(`${Date.now()}${Math.random()}`).digest('hex').slice(0, 24);
  const expiresAt = Date.now() + DUPLICATE_TOKEN_TTL_MS;
  store.set(token, { payloadHash, expiresAt, reviewedMatchCount: payload.reviewedMatchCount });
  for (const [k, v] of store.entries()) { if (v.expiresAt < Date.now()) store.delete(k); }
  return { token, expiresAt: new Date(expiresAt) };
}

export function validateAndConsumeToken(token: string, incomingPayload: DuplicateTokenPayload): { reviewedMatchCount: number } | null {
  const record = store.get(token);
  if (!record) return null;
  if (record.expiresAt < Date.now()) { store.delete(token); return null; }
  if (hashPayload(incomingPayload) !== record.payloadHash) return null;
  store.delete(token);
  return { reviewedMatchCount: record.reviewedMatchCount };
}
