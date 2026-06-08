import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(url, key);

async function testLogin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD in env vars.');
    process.exit(1);
  }

  console.log('Testing login...');

  // 1. Sign in
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error('❌ Login failed:', authError.message);
    process.exit(1);
  }

  console.log('✅ Login successful');
  console.log('   User ID:', authData.user?.id);
  console.log('   Email:', authData.user?.email);

  // 2. Fetch profile from public.users
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user!.id)
    .single();

  if (profileError || !profile) {
    console.error('❌ Profile fetch failed:', profileError?.message);
    process.exit(1);
  }

  console.log('✅ Profile loaded');
  console.log('   Name:', profile.name);
  console.log('   Role:', profile.role);
  console.log('   Current Post:', profile.current_post);

  // 3. Verify ADMIN role
  if (profile.role !== 'ADMIN') {
    console.error('❌ Expected ADMIN role, got:', profile.role);
    process.exit(1);
  }

  console.log('\n✅ All login checks passed!');

  // 4. Sign out
  await supabase.auth.signOut();
}

testLogin().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
