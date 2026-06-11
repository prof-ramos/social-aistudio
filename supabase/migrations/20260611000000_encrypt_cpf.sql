-- Plan 007: Encrypt CPF at rest using pgcrypto
-- Migration: 20260611000000_encrypt_cpf.sql

-- 1. Enable pgcrypto extension (available on all Supabase plans)
-- Supabase installs pgcrypto in the `extensions` schema, so all function
-- calls must be schema-qualified: extensions.pgp_sym_encrypt(), etc.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Add cpf_encrypted BYTEA column to member_requests
ALTER TABLE member_requests ADD COLUMN IF NOT EXISTS cpf_encrypted BYTEA;

-- 3. Migrate existing plaintext CPFs to encrypted format (conditional)
-- Only runs if: (a) there are rows with plaintext CPF, AND (b) the crypt key is configured.
-- If the key is not yet set, current_setting returns empty string and pgp_sym_encrypt
-- would fail — so we skip the migration and rely on the app to backfill later.
DO $$
BEGIN
  IF current_setting('app.asof_crypt_key', true) <> '' THEN
    UPDATE member_requests
    SET cpf_encrypted = extensions.pgp_sym_encrypt(cpf, current_setting('app.asof_crypt_key', true))
    WHERE cpf IS NOT NULL AND cpf_encrypted IS NULL;
    RAISE NOTICE 'Migrated % existing CPFs to encrypted format', found;
  ELSE
    RAISE NOTICE 'app.asof_crypt_key not configured — skipping plaintext CPF migration. Backfill manually after setting the key.';
  END IF;
END;
$$;

-- 4. Add cpf_encrypted and matricula columns to users table
-- (Schema gap: adminService.createUserFromRequest already inserts cpf and matricula
--  into columns that don't exist yet on the users table.)
ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf_encrypted BYTEA;
ALTER TABLE users ADD COLUMN IF NOT EXISTS matricula TEXT;

-- 5. SECURITY DEFINER function: insert member request with encrypted CPF
-- Accepts plaintext CPF and encrypts it server-side before storage.
CREATE OR REPLACE FUNCTION insert_member_request(
  p_name TEXT,
  p_email TEXT,
  p_cpf TEXT,
  p_matricula TEXT,
  p_category TEXT,
  p_current_post TEXT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO member_requests (name, email, cpf_encrypted, matricula, category, current_post, status)
  VALUES (
    p_name, p_email,
    extensions.pgp_sym_encrypt(p_cpf, current_setting('app.asof_crypt_key', true)),
    p_matricula, p_category::user_role, p_current_post, 'PENDING'
  )
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

-- 6. SECURITY DEFINER function: admin reads member requests with decrypted CPF
-- Only accessible to admin users (enforced by EXISTS check).
CREATE OR REPLACE FUNCTION get_member_requests_for_admin()
RETURNS TABLE(
  id UUID, name TEXT, email TEXT, cpf_decrypted TEXT,
  matricula TEXT, category user_role, current_post TEXT,
  status request_status, rejection_reason TEXT, created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mr.id,
    mr.name,
    mr.email,
    extensions.pgp_sym_decrypt(mr.cpf_encrypted, current_setting('app.asof_crypt_key', true)) AS cpf_decrypted,
    mr.matricula,
    mr.category,
    mr.current_post,
    mr.status,
    mr.rejection_reason,
    mr.created_at
  FROM member_requests mr
  WHERE EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN');
END;
$$;

-- 7. SECURITY DEFINER function: create user from approved member request
-- Accepts plaintext CPF and encrypts it server-side before storage.
CREATE OR REPLACE FUNCTION create_user_from_member_request(
  p_uid UUID,
  p_name TEXT,
  p_email TEXT,
  p_role TEXT,
  p_cpf TEXT,
  p_matricula TEXT,
  p_current_post TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO users (id, name, email, role, cpf_encrypted, matricula, current_post)
  VALUES (
    p_uid, p_name, p_email, p_role::user_role,
    extensions.pgp_sym_encrypt(p_cpf, current_setting('app.asof_crypt_key', true)),
    p_matricula, p_current_post
  );
END;
$$;

-- NOTE: The plaintext `cpf` column on member_requests is intentionally kept
-- for now. It will be dropped in a follow-up migration after verifying that
-- cpf_encrypted is fully populated and all RPCs work correctly in production.
-- See Plan 007 Step 6.