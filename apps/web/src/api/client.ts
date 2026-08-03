const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** Called once from AuthProvider so the client can force a logout when refresh fails. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

async function parseErrorBody(response: Response): Promise<{ code: string; message: string; details?: unknown }> {
  try {
    const body = (await response.json()) as { code?: string; message?: string; details?: unknown };
    return { code: body.code ?? 'UNKNOWN_ERROR', message: body.message ?? response.statusText, details: body.details };
  } catch {
    return { code: 'UNKNOWN_ERROR', message: response.statusText };
  }
}

async function refreshAccessToken(): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
  if (!response.ok) return false;
  const body = (await response.json()) as { accessToken: string };
  setAccessToken(body.accessToken);
  return true;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function doFetch<T>(path: string, options: RequestOptions): Promise<T> {
  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers: {
      ...(options.body !== undefined && { 'Content-Type': 'application/json' }),
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (response.status === 204) return undefined as T;
  if (response.ok) return (await response.json()) as T;
  const { code, message, details } = await parseErrorBody(response);
  throw new ApiError(response.status, code, message, details);
}

/**
 * A single automatic-refresh retry on 401 (except for auth endpoints
 * themselves, which must fail directly). If refresh also fails, the
 * unauthorized handler (set by AuthProvider) forces a logout.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await doFetch<T>(path, options);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && !path.startsWith('/auth/')) {
      const refreshed = await refreshAccessToken();
      if (refreshed) return await doFetch<T>(path, options);
      onUnauthorized?.();
    }
    throw err;
  }
}

export const api = {
  get: <T>(path: string, query?: Record<string, string | number | undefined>) => apiRequest<T>(path, { method: 'GET', query }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string, query?: Record<string, string | number | undefined>) => apiRequest<T>(path, { method: 'DELETE', query }),
};
