-- Adicionar coluna postos à tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS postos TEXT[] DEFAULT '{}';

-- Adicionar GIN index para suportar operador && (array overlap)
CREATE INDEX IF NOT EXISTS idx_users_postos ON users USING GIN (postos);