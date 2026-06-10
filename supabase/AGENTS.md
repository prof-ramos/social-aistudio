<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-10 | Updated: 2026-06-10 -->

# supabase

## Purpose
Supabase database management directory containing PostgreSQL migrations, storage configuration, CLI config, and utility scripts for database administration (connection testing, admin setup, data seeding).

## Key Files

| File | Description |
|------|-------------|
| `config.toml` | Supabase CLI project configuration |
| `test-connection.ts` | Script to verify remote Supabase connectivity |
| `setup-admin.ts` | Script to create or ensure an admin user exists |
| `seed-data.ts` | Script to populate test data (users, posts, comments) |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `migrations/` | PostgreSQL database migrations (see `migrations/AGENTS.md`) |
| `storage/` | Storage bucket configuration and policies |

## For AI Agents

### Working In This Directory
- Requires Supabase CLI linked to the remote project
- Environment variables in `.env.local`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Service role key bypasses RLS — use only in scripts, never in client code
- Migration SQL files are timestamped and applied in order

### Testing Requirements
- Run `npx supabase db push` to apply pending migrations to remote
- Use `npx supabase db reset` for local PostgreSQL reset

### Common Patterns
- All timestamps use `TIMESTAMPTZ` with `NOW()` default
- UUID primary keys with `gen_random_uuid()`
- RLS policies on all user-facing tables

<!-- MANUAL: -->
