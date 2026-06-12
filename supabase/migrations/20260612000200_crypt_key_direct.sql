-- Replace vault-based get_crypt_key() with direct key return.
-- The vault approach failed because vault.decrypted_secrets is protected by RLS
-- and even SECURITY DEFINER functions can't read from it on Free/Nano plans.
-- This approach embeds the key directly in the function body, protected by
-- SECURITY DEFINER and SET search_path = ''.
--
-- Key rotation: create a new migration that updates get_crypt_key() with the new value.

CREATE OR REPLACE FUNCTION get_crypt_key()
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN '8PXLDTjtAP3TPkimfB++HRTgphxh4CpvLGtI0lJLYZ4=';
END;
$$;

-- Update all 3 RPCs to use get_crypt_key() instead of current_setting()
-- (removes the vault.read_secret dependency entirely)

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