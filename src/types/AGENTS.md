<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-10 | Updated: 2026-06-10 -->

# types

## Purpose
Central TypeScript type definitions for domain models. All shared interfaces, enums, and type aliases are defined in a single file for consistency and ease of import.

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | All type definitions — `UserRole`, `Post`, `PostComment`, `ChatMessage`, `ChatSession`, `UserProfile`, `AuthUser`, and supporting types |

## For AI Agents

### Working In This Directory
- All types are exported from `index.ts` — import via `@/src/types`
- `UserRole` enum: `'ADMIN' | 'MEMBRO_ATIVO' | 'MEMBRO_APOSENTADO' | 'PENDENTE'`
- Types match the Supabase PostgreSQL schema (snake_case DB columns mapped to camelCase TS properties where needed)
- Add new types here when introducing new domain entities

<!-- MANUAL: -->
