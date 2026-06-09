-- Confirm email for the admin user so they can sign in
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'gabriel@asof.org.br';
