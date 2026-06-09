import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

async function testConnection() {
  console.log('Testing Supabase connection...\n');

  // Test 1: Auth endpoint
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error('❌ Auth error:', sessionError.message);
    process.exit(1);
  }
  console.log('✅ Auth endpoint reachable');

  // Test 2: Check if users table exists by selecting count
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  if (usersError && usersError.message.includes('does not exist')) {
    console.error('❌ Schema not applied — users table missing');
    process.exit(1);
  } else if (usersError) {
    console.log('ℹ️ users table exists but query error (expected without auth):', usersError.message);
  } else {
    console.log('✅ users table exists');
  }

  // Test 3: Check posts table
  const { error: postsError } = await supabase
    .from('posts')
    .select('*', { head: true });

  if (postsError && postsError.message.includes('does not exist')) {
    console.error('❌ posts table missing');
    process.exit(1);
  } else {
    console.log('✅ posts table exists');
  }

  // Test 4: Check chat_sessions table
  const { error: chatError } = await supabase
    .from('chat_sessions')
    .select('*', { head: true });

  if (chatError && chatError.message.includes('does not exist')) {
    console.error('❌ chat_sessions table missing');
    process.exit(1);
  } else {
    console.log('✅ chat_sessions table exists');
  }

  // Test 5: Check notifications table
  const { error: notifError } = await supabase
    .from('notifications')
    .select('*', { head: true });

  if (notifError && notifError.message.includes('does not exist')) {
    console.error('❌ notifications table missing');
    process.exit(1);
  } else {
    console.log('✅ notifications table exists');
  }

  console.log('\n✅ All checks passed! Schema is correctly deployed.');
}

testConnection();
