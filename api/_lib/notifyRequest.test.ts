import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, validateNotifyRequest, checkMemberRequest, _resetRateLimit, _setRedis } from './notifyRequest';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('validateNotifyRequest', () => {
  it('accepts valid input and returns trimmed fields', () => {
    const result = validateNotifyRequest({ name: '  João  ', email: ' joao@asof.org.br ', matricula: ' 123 ' });
    expect(result).toEqual({ ok: true, fields: { name: 'João', email: 'joao@asof.org.br', matricula: '123' } });
  });

  it('rejects a missing name', () => {
    expect(validateNotifyRequest({ email: 'a@b.com', matricula: '1' })).toEqual({ ok: false, error: 'Nome é obrigatório.' });
    expect(validateNotifyRequest({ name: '   ', email: 'a@b.com', matricula: '1' })).toEqual({ ok: false, error: 'Nome é obrigatório.' });
  });

  it('rejects bad emails, including the header-injection newline case', () => {
    for (const email of ['notanemail', 'a@b', 'a@b.com\nBcc: x@y.com']) {
      expect(validateNotifyRequest({ name: 'João', email, matricula: '1' })).toEqual({ ok: false, error: 'E-mail inválido.' });
    }
  });

  it('rejects a missing matricula', () => {
    expect(validateNotifyRequest({ name: 'João', email: 'a@b.com' })).toEqual({ ok: false, error: 'Matrícula é obrigatória.' });
  });

  it('tolerates null/undefined bodies', () => {
    expect(validateNotifyRequest(undefined)).toEqual({ ok: false, error: 'Nome é obrigatório.' });
    expect(validateNotifyRequest(null)).toEqual({ ok: false, error: 'Nome é obrigatório.' });
  });
});

describe('checkRateLimit (in-memory fallback)', () => {
  beforeEach(() => {
    _resetRateLimit();
    _setRedis(null); // ensure we use the in-memory path
    delete process.env.KV_URL;
  });

  it('allows the first 5 requests in a window and blocks the 6th', async () => {
    const now = 1_000_000;
    for (let i = 1; i <= 5; i++) {
      expect(await checkRateLimit('1.2.3.4', now)).toBe(true);
    }
    expect(await checkRateLimit('1.2.3.4', now)).toBe(false);
  });

  it('resets once the window has elapsed', async () => {
    const now = 1_000_000;
    for (let i = 1; i <= 5; i++) await checkRateLimit('1.2.3.4', now);
    expect(await checkRateLimit('1.2.3.4', now)).toBe(false);
    // past the 60s window
    expect(await checkRateLimit('1.2.3.4', now + 60_001)).toBe(true);
  });

  it('tracks IPs independently', async () => {
    const now = 1_000_000;
    for (let i = 1; i <= 5; i++) await checkRateLimit('1.1.1.1', now);
    expect(await checkRateLimit('1.1.1.1', now)).toBe(false);
    expect(await checkRateLimit('2.2.2.2', now)).toBe(true);
  });
});

describe('checkRateLimit (KV path)', () => {
  beforeEach(() => {
    _resetRateLimit();
  });

  function makeMockRedis(initial: Record<string, number> = {}) {
    const store = new Map<string, number>(Object.entries(initial));
    return {
      incr: vi.fn(async (key: string) => {
        const next = (store.get(key) ?? 0) + 1;
        store.set(key, next);
        return next;
      }),
      expire: vi.fn(async (_key: string, _seconds: number) => true),
      del: vi.fn(async (key: string) => {
        store.delete(key);
        return 1;
      }),
    } as unknown as import('@vercel/kv').VercelKV;
  }

  it('allows the first 5 requests and blocks the 6th via KV', async () => {
    const mock = makeMockRedis();
    _setRedis(mock);

    const now = 1_000_000;
    for (let i = 1; i <= 5; i++) {
      expect(await checkRateLimit('1.2.3.4', now)).toBe(true);
    }
    expect(await checkRateLimit('1.2.3.4', now)).toBe(false);

    expect(mock.incr).toHaveBeenCalledTimes(6);
    expect(mock.expire).toHaveBeenCalledTimes(1); // only on the first request
    expect(mock.expire).toHaveBeenCalledWith('rate_limit:1.2.3.4', 60);
  });

  it('tracks IPs independently via KV', async () => {
    const mock = makeMockRedis();
    _setRedis(mock);

    const now = 1_000_000;
    for (let i = 1; i <= 5; i++) await checkRateLimit('1.1.1.1', now);
    expect(await checkRateLimit('1.1.1.1', now)).toBe(false);
    expect(await checkRateLimit('2.2.2.2', now)).toBe(true);

    // Each IP gets its own key
    expect(mock.incr).toHaveBeenCalledWith('rate_limit:1.1.1.1');
    expect(mock.incr).toHaveBeenCalledWith('rate_limit:2.2.2.2');
  });

  it('falls back to in-memory when KV client is unavailable', async () => {
    _setRedis(null);
    delete process.env.KV_URL;

    const now = 1_000_000;
    for (let i = 1; i <= 5; i++) {
      expect(await checkRateLimit('1.2.3.4', now)).toBe(true);
    }
    expect(await checkRateLimit('1.2.3.4', now)).toBe(false);
  });
});

describe('validateNotifyRequest — field length limits', () => {
  it('rejects name exceeding 100 characters', () => {
    const longName = 'a'.repeat(101);
    expect(validateNotifyRequest({ name: longName, email: 'a@b.com', matricula: '1' })).toEqual({
      ok: false,
      error: 'Nome deve ter no máximo 100 caracteres.',
    });
  });

  it('accepts name at exactly 100 characters', () => {
    const name = 'a'.repeat(100);
    const result = validateNotifyRequest({ name, email: 'a@b.com', matricula: '1' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.fields.name).toBe(name);
  });

  it('rejects email exceeding 100 characters', () => {
    const longEmail = `${'a'.repeat(90)}@${'b'.repeat(20)}.com`; // > 100 chars
    expect(validateNotifyRequest({ name: 'João', email: longEmail, matricula: '1' })).toEqual({
      ok: false,
      error: 'E-mail deve ter no máximo 100 caracteres.',
    });
  });

  it('rejects matricula exceeding 100 characters', () => {
    const longMatricula = '1'.repeat(101);
    expect(validateNotifyRequest({ name: 'João', email: 'a@b.com', matricula: longMatricula })).toEqual({
      ok: false,
      error: 'Matrícula deve ter no máximo 100 caracteres.',
    });
  });

  it('accepts matricula at exactly 100 characters', () => {
    const matricula = '1'.repeat(100);
    const result = validateNotifyRequest({ name: 'João', email: 'a@b.com', matricula });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.fields.matricula).toBe(matricula);
  });
});

function makeMockSupabase(selectResult: { data: unknown | null; error: unknown | null }) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(selectResult),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

describe('checkMemberRequest', () => {
  it('returns ok for a PENDING request', async () => {
    const mock = makeMockSupabase({
      data: { id: '1', status: 'PENDING' },
      error: null,
    });
    const result = await checkMemberRequest(mock, 'test@example.com');
    expect(result).toEqual({ ok: true });
  });

  it('returns 404 when no request exists', async () => {
    const mock = makeMockSupabase({
      data: null,
      error: { code: 'PGRST116' },
    });
    const result = await checkMemberRequest(mock, 'nonexistent@example.com');
    expect(result).toEqual({ ok: false, status: 404, error: 'Solicitação não encontrada' });
  });

  it('returns 409 when request is already APPROVED', async () => {
    const mock = makeMockSupabase({
      data: { id: '1', status: 'APPROVED' },
      error: null,
    });
    const result = await checkMemberRequest(mock, 'approved@example.com');
    expect(result).toEqual({ ok: false, status: 409, error: 'Solicitação já processada' });
  });

  it('returns 409 when request is already REJECTED', async () => {
    const mock = makeMockSupabase({
      data: { id: '1', status: 'REJECTED' },
      error: null,
    });
    const result = await checkMemberRequest(mock, 'rejected@example.com');
    expect(result).toEqual({ ok: false, status: 409, error: 'Solicitação já processada' });
  });

  it('returns 404 on generic Supabase error', async () => {
    const mock = makeMockSupabase({
      data: null,
      error: { message: 'connection refused' },
    });
    const result = await checkMemberRequest(mock, 'test@example.com');
    expect(result).toEqual({ ok: false, status: 404, error: 'Solicitação não encontrada' });
  });
});
