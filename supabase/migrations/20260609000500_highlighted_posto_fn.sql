-- Efficient highlighted posto lookup (most reviews, highest avg rating)
CREATE OR REPLACE FUNCTION get_highlighted_posto()
RETURNS TABLE (
  name TEXT,
  slug TEXT,
  review_count BIGINT,
  average_rating NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.name,
    p.slug,
    COUNT(r.id) AS review_count,
    AVG(r.rating) AS average_rating
  FROM postos p
  INNER JOIN reviews r ON r.posto_id = p.id
  GROUP BY p.id, p.name, p.slug, p.created_at
  ORDER BY COUNT(r.id) DESC, AVG(r.rating) DESC, p.created_at DESC
  LIMIT 1;
$$;