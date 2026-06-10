// Single source of truth for the access-request endpoint's validation + rate limit.
// Imported by both server.ts (Express, dev/long-running) and api/notify-request.ts
// (Vercel serverless). Keep it framework-free so both callers can use it.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string, now: number = Date.now()): boolean {
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
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
export function _resetRateLimit() { rateLimitStore.clear(); }
