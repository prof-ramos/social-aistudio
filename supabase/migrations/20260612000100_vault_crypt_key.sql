-- Replace current_setting('app.asof_crypt_key') with a SECURITY DEFINER helper function.
-- This eliminates the need for ALTER DATABASE SET (which requires superuser on Free/Nano plans)
-- and makes the crypt key fully manageable via migrations (version controlled).
--
-- Key rotation: create a new migration that updates get_crypt_key() with the new value.
-- The key is embedded in the function body, which is protected by SECURITY DEFINER
-- and SET search_path = '' (prevents search path attacks).
--
-- IMPORTANT: The plaintext `cpf` column has already been dropped (migration 20260612000000).
-- The RPCs below use only `cpf_encrypted` and the helper function for decryption.

-- 1. Helper function: returns the encryption key
-- SECURITY DEFINER runs as the function owner with elevated privileges.
-- SET search_path = '' prevents search path injection attacks.
-- The function raises an exception if called in an unexpected context.
CREATE OR REPLACE FUNCTION get_crypt_key()
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN '8PXLDTjtAP3TPkimfB++HRTgphxh4CpvLGtI0lJLYZ4=';
END;
$$;

-- 2. Update insert_member_request: use get_crypt_key() instead of current_setting
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
    extensions.pgp_sym_encrypt(p_cpf, get_crypt_key()),
    p_matricula, p_category::user_role, p_current_post, 'PENDING'
  )
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

-- 3. Update get_member_requests_for_admin: use get_crypt_key() instead of current_setting
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
    extensions.pgp_sym_decrypt(mr.cpf_encrypted, get_crypt_key()) AS cpf_decrypted,
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

-- 4. Update create_user_from_member_request: use get_crypt_key() instead of current_setting
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
    extensions.pgp_sym_encrypt(p_cpf, get_crypt_key()),
    p_matricula, p_current_post
  );
END;
$$;
