<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-10 | Updated: 2026-06-10 -->

# src

## Purpose
Main application source code for the Social-ASOF internal social network. Contains all React components, hooks, services, pages, types, and configuration needed to run the SPA frontend.

## Key Files

| File | Description |
|------|-------------|
| `App.tsx` | Root React component with BrowserRouter, Layout wrapper, and route definitions |
| `main.tsx` | React entry point — renders `<App />` into the DOM |
| `index.css` | Global styles with Tailwind CSS v4 imports and base layer custom properties |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `components/` | Reusable React components organized by domain (see `components/AGENTS.md`) |
| `pages/` | Route-level page components (see `pages/AGENTS.md`) |
| `hooks/` | Custom React hooks for business logic and state (see `hooks/AGENTS.md`) |
| `services/` | Data access layer encapsulating Supabase SDK calls (see `services/AGENTS.md`) |
| `contexts/` | React context providers (see `contexts/AGENTS.md`) |
| `lib/` | Utility configurations and shared helpers (see `lib/AGENTS.md`) |
| `types/` | TypeScript type definitions (see `types/AGENTS.md`) |
| `data/` | Static data and seed information (see `data/AGENTS.md`) |
| `layout/` | Layout wrapper components (see `layout/AGENTS.md`) |
| `routes/` | Route configuration definitions (see `routes/AGENTS.md`) |
| `policies/` | Business rule/policy validators (see `policies/AGENTS.md`) |
| `assets/` | Static assets like SVG brand files (see `assets/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- All source code is TypeScript with strict mode enabled
- Use barrel exports (`index.ts`) for multi-file modules where practical
- Path alias `@/` maps to repository root (configured in vite.config.ts and tsconfig.json)
- Prefer functional components with hooks over class components
- Tailwind CSS v4 for all styling — no CSS modules or styled-components

### Testing Requirements
- Co-locate tests next to source files as `*.test.ts` / `*.test.tsx`
- Run `npm test` (Vitest) before committing changes
- Setup mocks in `vitest.setup.ts` for browser APIs (ResizeObserver, localStorage, matchMedia)

### Common Patterns
- Auth state flows through `AuthContext` — access via `useAuth()` hook
- Services are plain objects (not classes) that wrap Supabase SDK calls
- Hooks subscribe to Supabase Realtime channels and clean up on unmount
- Pages receive authenticated `profile` prop from Layout and compose hooks

## Dependencies

### Internal
- Root project configuration in `vite.config.ts`, `tsconfig.json`
- Test setup in `vitest.setup.ts`

### External
- React 19 — UI framework
- Supabase JS SDK — Auth, Database, Realtime, Storage
- Tailwind CSS v4 — Utility-first styling
- React Router DOM v7 — Client-side routing
- Motion — Animation library
- TipTap — Rich text editor
- Lucide React — Icon library

<!-- MANUAL: -->
