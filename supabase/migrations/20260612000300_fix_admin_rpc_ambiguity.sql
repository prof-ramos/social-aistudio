-- Fix column ambiguity in get_member_requests_for_admin.
-- The RETURN TABLE column "id" conflicts with the subquery "WHERE id = auth.uid()".
-- Qualify all column references in the WHERE clause to remove ambiguity.

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
    extensions.pgp_sym_decrypt(mr.cpf_encrypted, get_crypt_key()) AS cpf_decrypted,
    mr.matricula,
    mr.category,
    mr.current_post,
    mr.status,
    mr.rejection_reason,
    mr.created_at
  FROM member_requests mr
  WHERE EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'ADMIN');
END;
$$;