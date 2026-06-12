// Server-side Supabase client using process.env (works in Express and Vercel serverless).
// The client-side client in src/lib/supabase.ts uses import.meta.env (Vite-only).
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (!url || !key) {
    throw new Error(
      'Supabase credentials not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
  }

  _client = createClient(url, key);
  return _client;
}

/** Replace the cached client — use only in tests. */
export function _setSupabaseClient(client: SupabaseClient | null) {
  _client = client;
}