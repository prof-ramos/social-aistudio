-- Remove plaintext CPF column now that cpf_encrypted is populated and RPCs work.
-- The insert_member_request RPC no longer writes to the cpf column.
-- The get_member_requests_for_admin RPC decrypts cpf_encrypted and returns it as cpf_decrypted.
--
-- Prerequisite: Steps 0-2 of Plan 012 must be completed first:
--   0. app.asof_crypt_key configured in Supabase Dashboard
--   1. Existing CPFs backfilled to cpf_encrypted
--   2. All 3 RPCs verified working with the crypt key
--
-- Safety check: abort if any rows still have plaintext CPF without encrypted version.
-- This prevents data loss if the migration is applied before backfill completes.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM member_requests WHERE cpf IS NOT NULL AND cpf_encrypted IS NULL) THEN
    RAISE EXCEPTION 'Cannot drop cpf column: % rows have plaintext CPF without encrypted version',
      (SELECT count(*) FROM member_requests WHERE cpf IS NOT NULL AND cpf_encrypted IS NULL);
  END IF;
END;
$$;

ALTER TABLE member_requests DROP COLUMN IF EXISTS cpf;

-- NOTE: The TypeScript property MemberRequest.cpf is NOT renamed.
-- It is populated from the RPC return field cpf_decrypted (via adminService.ts:54),
-- not from the database column. The RPC get_member_requests_for_admin() decrypts
-- cpf_encrypted and returns it as cpf_decrypted, which is mapped to MemberRequest.cpf.
-- No code reads the plaintext cpf column directly.