-- Make reviews author/category columns nullable
-- Author info is now resolved via users_public joins, not stored redundantly

ALTER TABLE reviews ALTER COLUMN author_name DROP NOT NULL;
ALTER TABLE reviews ALTER COLUMN author_role DROP NOT NULL;
ALTER TABLE reviews ALTER COLUMN category DROP NOT NULL;