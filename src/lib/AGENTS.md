<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-10 | Updated: 2026-06-10 -->

# lib

## Purpose
Library initialization files and shared utilities. Contains the Supabase client singleton, HTML sanitization helpers, Tailwind class merging utility, and country flag data.

## Key Files

| File | Description |
|------|-------------|
| `supabase.ts` | Supabase client initialization with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| `utils.ts` | `cn()` utility — merges Tailwind classes using `clsx` + `tailwind-merge` |
| `sanitize.ts` | HTML sanitization wrapper using DOMPurify for rich text content |
| `countryFlags.ts` | Country-to-flag mapping data for diplomatic posts |

## Tests

| File | Description |
|------|-------------|
| `sanitize.test.ts` | Tests for HTML sanitization logic |

## For AI Agents

### Working In This Directory
- `cn()` is the standard class merging utility — use in all components
- Supabase client is a singleton; do not create additional instances
- Sanitize all user-generated HTML content before rendering

<!-- MANUAL: -->
