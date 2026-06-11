-- Returns users who share posto(s) with the requesting user.
-- Compares current_post and postos array for overlap.
CREATE OR REPLACE FUNCTION get_common_posto_members(
  p_exclude_user_id UUID,
  p_user_postos TEXT[],
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  avatar_url TEXT,
  role TEXT,
  current_post TEXT,
  postos TEXT[],
  is_online BOOLEAN,
  last_online TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.name,
    u.avatar_url,
    u.role::TEXT,
    u.current_post,
    u.postos,
    u.is_online,
    u.last_online
  FROM public.users u
  WHERE u.id != p_exclude_user_id
    AND (
      u.current_post = ANY(p_user_postos)
      OR u.postos && p_user_postos  -- array overlap operator
    )
    AND u.role != 'PENDENTE'
  ORDER BY
    u.is_online DESC NULLS LAST,
    u.last_online DESC NULLS LAST
  LIMIT p_limit;
END;
$$;