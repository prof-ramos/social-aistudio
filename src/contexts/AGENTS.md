<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-10 | Updated: 2026-06-10 -->

# contexts

## Purpose
React context providers that supply global application state. Currently contains the authentication context which manages user session state across the entire component tree.

## Key Files

| File | Description |
|------|-------------|
| `AuthContext.tsx` | Auth provider wrapping Supabase auth state — exposes `user`, `profile`, `session`, `signIn`, `signOut` via `useAuth()` hook |

## For AI Agents

### Working In This Directory
- Context providers wrap the application in `src/App.tsx`
- Auth state is the single source of truth for current user identity
- Access auth context via the `useAuth()` custom import, not `useContext` directly

<!-- MANUAL: -->
