import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

// Mock ResizeObserver — must be a class so Radix UI can call `new ResizeObserver(cb)`
global.ResizeObserver = class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(_callback: ResizeObserverCallback) {}
} as unknown as typeof ResizeObserver;

// Mock localStorage
const localStorageMock = (function () {
  let store: Record<string, string> = {};

  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock elementFromPoint for Tiptap/ProseMirror in jsdom
document.elementFromPoint = vi.fn().mockReturnValue(null);

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// jsdom não implementa scrollTo — silenciar o warning
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// Mock global de fetch para SVG assets (/logo.svg, /favicon.svg).
// Testes que precisam de fetch real devem sobrescrever global.fetch no próprio beforeEach.
const EMPTY_SVG = '<svg viewBox="0 0 1 1" xmlns="http://www.w3.org/2000/svg"></svg>';
const SVG_ASSETS = ['/logo.svg', '/favicon.svg'];

global.fetch = vi.fn((input: RequestInfo | URL) => {
  const url = String(input);
  if (SVG_ASSETS.some(asset => url.includes(asset))) {
    return Promise.resolve({
      ok: true,
      text: () => Promise.resolve(EMPTY_SVG),
    } as Response);
  }
  // Para chamadas de API (ex: Supabase) — retornar JSON vazio para não quebrar testes
  // que não mockam serviços individualmente.
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
    text: () => Promise.resolve('[]'),
  } as Response);
}) as unknown as typeof fetch;

