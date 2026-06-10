<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-10 | Updated: 2026-06-10 -->

# layout

## Purpose
Application layout wrapper components. Contains the top-level layout that wraps all routes with navigation, sidebar, and auth-gated content.

## Key Files

| File | Description |
|------|-------------|
| `AppLayout.tsx` | Main application layout — renders Navbar, sidebar, and content area; handles auth redirect and admin route gating |

## For AI Agents

### Working In This Directory
- `AppLayout` wraps all routes — it gates auth state and admin routes
- Modifying the layout affects every page in the application
- The layout component receives `profile` from AuthContext passes it to child pages

<!-- MANUAL: -->
