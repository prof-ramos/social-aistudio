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

async function setupAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD in env vars.');
    process.exit(1);
  }

  console.log('Setting up admin user...');

  // Step 1: Try to sign in first (user may already exist)
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  let userId: string | undefined;

  if (signInError) {
    console.log('Sign in failed:', signInError.message, '→ trying sign up...');

    // Step 2: Sign up with admin role in metadata
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'ADMIN', name: 'Gabriel Admin' },
      },
    });

    if (signUpError) {
      // "For security purposes..." means user already exists but we can't sign in (wrong password?)
      if (signUpError.message.includes('For security purposes') || signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
        console.error('User already exists but sign in failed. Check password or confirm email.');
        process.exit(1);
      }
      console.error('SignUp error:', signUpError.message);
      process.exit(1);
    }

    userId = signUpData.user?.id;
    if (!userId) {
      console.error('No user id after sign up');
      process.exit(1);
    }
    console.log('User created:', userId);
  } else {
    userId = signInData.user?.id;
    console.log('User signed in:', userId);
  }

  if (!userId) {
    console.error('No user id');
    process.exit(1);
  }

  // Step 3: Verify/update profile role
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError.message);
    process.exit(1);
  }

  console.log('Profile:', profile.name, '| role:', profile.role);

  if (profile.role !== 'ADMIN') {
    console.log('Updating role to ADMIN...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'ADMIN' })
      .eq('id', userId);

    if (updateError) {
      console.error('Update error:', updateError.message);
      process.exit(1);
    }
    console.log('✅ Role updated to ADMIN');
  } else {
    console.log('✅ Role is already ADMIN');
  }

  // Sign out
  await supabase.auth.signOut();
  console.log('\n✅ Admin user configured:', email);
}

setupAdmin();
