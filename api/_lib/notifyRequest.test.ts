import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, validateNotifyRequest, _resetRateLimit } from './notifyRequest';

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

describe('checkRateLimit', () => {
  beforeEach(() => {
    _resetRateLimit();
  });

  it('allows the first 5 requests in a window and blocks the 6th', () => {
    const now = 1_000_000;
    for (let i = 1; i <= 5; i++) {
      expect(checkRateLimit('1.2.3.4', now)).toBe(true);
    }
    expect(checkRateLimit('1.2.3.4', now)).toBe(false);
  });

  it('resets once the window has elapsed', () => {
    const now = 1_000_000;
    for (let i = 1; i <= 5; i++) checkRateLimit('1.2.3.4', now);
    expect(checkRateLimit('1.2.3.4', now)).toBe(false);
    // past the 60s window
    expect(checkRateLimit('1.2.3.4', now + 60_001)).toBe(true);
  });

  it('tracks IPs independently', () => {
    const now = 1_000_000;
    for (let i = 1; i <= 5; i++) checkRateLimit('1.1.1.1', now);
    expect(checkRateLimit('1.1.1.1', now)).toBe(false);
    expect(checkRateLimit('2.2.2.2', now)).toBe(true);
  });
});
