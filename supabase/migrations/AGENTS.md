<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-10 | Updated: 2026-06-10 -->

# migrations

## Purpose
PostgreSQL database migrations for the Supabase project. Applied in timestamp order to manage schema evolution. Each migration addresses a specific schema change or data fix.

## Key Files

| File | Description |
|------|-------------|
| `20260608013515_schema_init.sql` | Initial schema — users, posts, comments, notifications tables |
| `20260608014000_fix_trigger_search_path.sql` | Fix trigger search_path security issue |
| `20260608014100_fix_rls_recursion.sql` | Fix infinite recursion in RLS policies |
| `20260608014200_confirm_admin_email.sql` | Admin email confirmation migration |
| `20260608014300_postos_schema.sql` | Diplomatic posts schema (postos, reviews) |
| `20260608021000_fix_users_select_policy.sql` | Fix users table select policy |
| `20260608030000_fix_critical_issues.sql` | Critical bug fixes batch |
| `20260608031000_chat_rpc.sql` | Chat-related RPC functions |
| `20260609000000_add_soft_delete_and_rating.sql` | Soft delete support + rating fields |
| `20260609000100_chat_read_receipts.sql` | Chat read receipts implementation |
| `20260609000200_reviews_nullable_columns.sql` | Make review columns nullable |
| `20260609000300_add_profile_contact.sql` | Add contact fields to user profiles |
| `20260609000400_avatars_storage_bucket.sql` | Avatar storage bucket setup |
| `20260609000500_highlighted_posto_fn.sql` | Highlighted posto function |

## For AI Agents

### Working In This Directory
- Migrations are applied in filename order (timestamp prefix)
- Use `npx supabase db push` to apply pending migrations to remote
- Use `npx supabase db reset` to reset local DB and re-apply all migrations
- Never edit an applied migration — create a new one instead
- All tables use UUID primary keys with `gen_random_uuid()` and `TIMESTAMPTZ` timestamps

<!-- MANUAL: -->
