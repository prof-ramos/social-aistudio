-- Schema para Postos do Exterior (reviews, campos)

CREATE TABLE postos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  city TEXT,
  country TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posto_id UUID NOT NULL REFERENCES postos(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_role user_role NOT NULL,
  category TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE posto_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posto_id UUID NOT NULL REFERENCES postos(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  field_type TEXT NOT NULL,
  body TEXT NOT NULL,
  experience_start BIGINT,
  experience_end BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_posto ON reviews(posto_id, created_at DESC);
CREATE INDEX idx_posto_fields_posto ON posto_fields(posto_id, created_at DESC);

ALTER TABLE postos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE posto_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Postos visible to all" ON postos FOR SELECT USING (true);
CREATE POLICY "Users create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Reviews visible with posto" ON reviews
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM postos WHERE postos.id = reviews.posto_id
  ));
CREATE POLICY "Users create posto fields" ON posto_fields
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Posto fields visible with posto" ON posto_fields
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM postos WHERE postos.id = posto_fields.posto_id
  ));
