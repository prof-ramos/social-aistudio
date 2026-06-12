-- Fix search_path issue: qualify ALL references with schema prefixes.
-- SET search_path = '' removes ALL schemas from the search path, including `public`.
-- This means even function calls like get_crypt_key() and extensions.pgp_sym_encrypt
-- must be explicitly schema-qualified.

-- Fix get_member_requests_for_admin: qualify all references
CREATE OR REPLACE FUNCTION get_member_requests_for_admin()
RETURNS TABLE(
  id UUID, name TEXT, email TEXT, cpf_decrypted TEXT,
  matricula TEXT, category user_role, current_post TEXT,
  status request_status, rejection_reason TEXT, created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mr.id,
    mr.name,
    mr.email,
    extensions.pgp_sym_decrypt(mr.cpf_encrypted, public.get_crypt_key()) AS cpf_decrypted,
    mr.matricula,
    mr.category,
    mr.current_post,
    mr.status,
    mr.rejection_reason,
    mr.created_at
  FROM public.member_requests mr
  WHERE EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'ADMIN');
END;
$$;

-- Fix insert_member_request: qualify all references
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
SET search_path = ''
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.member_requests (name, email, cpf_encrypted, matricula, category, current_post, status)
  VALUES (
    p_name, p_email,
    extensions.pgp_sym_encrypt(p_cpf, public.get_crypt_key()),
    p_matricula, p_category::user_role, p_current_post, 'PENDING'
  )
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

-- Fix create_user_from_member_request: qualify all references
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
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role, cpf_encrypted, matricula, current_post)
  VALUES (
    p_uid, p_name, p_email, p_role::user_role,
    extensions.pgp_sym_encrypt(p_cpf, public.get_crypt_key()),
    p_matricula, p_current_post
  );
END;
$$;