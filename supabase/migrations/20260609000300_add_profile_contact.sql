-- Add contact visibility fields for Oficial de Chancelaria profile
-- Migration: 20260609000300_add_profile_contact.sql

-- 1. Add new columns to users table (idempotent)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS phone_is_whatsapp BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_phone BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS show_email BOOLEAN DEFAULT FALSE;

-- 2. Update users_public view — gate contact fields by visibility flags
CREATE OR REPLACE VIEW users_public AS
SELECT
  id,
  name,
  avatar_url,
  bio,
  current_post,
  role,
  is_online,
  last_online,
  interests,
  created_at,
  CASE WHEN show_phone THEN phone ELSE NULL END AS phone,
  CASE WHEN show_phone THEN phone_is_whatsapp ELSE false END AS phone_is_whatsapp,
  CASE WHEN show_email THEN email ELSE NULL END AS email
FROM public.users;