/**
 * Upload Logos Script: Upload ASOF logo SVGs to Supabase Storage
 *
 * Prerequisites:
 *   1. Migration 20260611200000_logos_storage_bucket.sql must be applied
 *   2. .env.local must contain VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   npx tsx scripts/upload-logos.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function log(...args: any[]) {
  console.log('[logos]', ...args);
}

async function uploadLogo(filePath: string, storagePath: string): Promise<string | null> {
  const content = fs.readFileSync(filePath, 'utf-8');

  const { data, error } = await supabase.storage
    .from('logos')
    .upload(storagePath, content, {
      contentType: 'image/svg+xml',
      upsert: true,
    });

  if (error) {
    log('Upload error for', storagePath, ':', error.message);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('logos')
    .getPublicUrl(storagePath);

  return urlData.publicUrl;
}

async function uploadLogos() {
  log('Starting logo upload...\n');

  const assetsDir = '/Users/gabrielramos/logos_asof/asof-encerramento/assets';
  const files = [
    { local: 'logo_dark.svg', storage: 'logo_dark.svg' },
    { local: 'logo_optimized.svg', storage: 'logo_optimized.svg' },
  ];

  const results: { file: string; url: string | null }[] = [];

  for (const { local, storage } of files) {
    const localPath = path.join(assetsDir, local);

    if (!fs.existsSync(localPath)) {
      log(`File not found: ${localPath}`);
      results.push({ file: local, url: null });
      continue;
    }

    log(`Uploading ${local} → logos/${storage} ...`);
    const url = await uploadLogo(localPath, storage);
    results.push({ file: local, url });
  }

  log('\n--- Results ---');
  for (const { file, url } of results) {
    if (url) {
      log(`✅ ${file}: ${url}`);
    } else {
      log(`❌ ${file}: upload failed`);
    }
  }
}

uploadLogos().catch((err) => {
  console.error('Upload failed:', err);
  process.exit(1);
});
