// Single source of truth for the access-request endpoint's validation + rate limit.
// Imported by both server.ts (Express, dev/long-running) and api/notify-request.ts
// (Vercel serverless). Keep it framework-free so both callers can use it.
import { createClient, type VercelKV } from '@vercel/kv';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Lazy-initialised Redis client (only created when KV_URL is present).
// We keep a single module-level variable so we can mock it in tests.
let _redis: VercelKV | null = null;

function getRedis(): VercelKV | null {
  if (_redis) return _redis;
  const url = process.env.KV_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url) return null;
  try {
    _redis = createClient({ url, token });
    return _redis;
  } catch {
    return null;
  }
}

// Exported for tests so we can swap the client without touching env vars.
export function _setRedis(client: VercelKV | null) {
  _redis = client;
}

// Atomic KV-based check using INCR + EXPIRE.
// Returns true when the request is within the rate limit.
async function checkRateLimitKv(ip: string, now: number): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false; // shouldn't happen, but be defensive

  const key = `rate_limit:${ip}`;
  // redis.incr returns the new value after incrementing.
  const count = await redis.incr(key);

  if (count === 1) {
    // First request in this window — set expiry.
    await redis.expire(key, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000));
  }

  return count <= RATE_LIMIT_MAX;
}

// In-memory fallback used when KV_URL is absent (local/dev).
function checkRateLimitMemory(ip: string, now: number): boolean {
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

export async function checkRateLimit(ip: string, now: number = Date.now()): Promise<boolean> {
  const redis = getRedis();
  if (redis) {
    return checkRateLimitKv(ip, now);
  }
  return checkRateLimitMemory(ip, now);
}

// Conservative single-line email check: no whitespace/control chars, one @,
// non-empty local + domain with a dot. Rejects the newlines that enable
// header injection if the body is ever moved into a header.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type NotifyFields = { name: string; email: string; matricula: string };

export function validateNotifyRequest(
  body: unknown
): { ok: true; fields: NotifyFields } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const { name, email, matricula } = b;
  if (typeof name !== 'string' || name.trim().length === 0)
    return { ok: false, error: 'Nome é obrigatório.' };
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim()))
    return { ok: false, error: 'E-mail inválido.' };
  if (typeof matricula !== 'string' || matricula.trim().length === 0)
    return { ok: false, error: 'Matrícula é obrigatória.' };
  return { ok: true, fields: { name: name.trim(), email: email.trim(), matricula: matricula.trim() } };
}

// Reset hook for tests (the rate-limit Map is module-level state).
// For KV tests, callers should also clear the mock Redis keys they create.
export function _resetRateLimit() {
  rateLimitStore.clear();
}
