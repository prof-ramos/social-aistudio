<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-10 | Updated: 2026-06-10 -->

# components

## Purpose
Reusable React components organized by domain. Contains UI primitives, feed-specific components, layout elements, brand identity components, and application-level components like error boundaries and onboarding tours.

## Key Files

| File | Description |
|------|-------------|
| `ErrorBoundary.tsx` | React error boundary with fallback UI |
| `Tour.tsx` | Onboarding tour component powered by react-joyride |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `ui/` | Reusable UI primitives — Button, Card, Toast, etc. (see `ui/AGENTS.md`) |
| `feed/` | Feed-specific components — PostCard, PostEditor, Reactions (see `feed/AGENTS.md`) |
| `layout/` | Layout components — Navbar, PageContainer (see `layout/AGENTS.md`) |
| `brand/` | Brand identity components — Logo, AuthShell, BrandLockup (see `brand/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Each component has its own file for tree-shaking
- UI primitives are exported via `ui/index.ts` barrel
- Components use Tailwind CSS v4 exclusively — no inline styles or CSS modules
- Use `cn()` utility from `src/lib/utils.ts` for conditional class merging

### Testing Requirements
- Co-located `*.test.tsx` files for component tests
- Use Testing Library queries over component internals
- Test accessibility (roles, aria attributes) alongside behavior

### Common Patterns
- Props interfaces defined and exported from each component file
- Components accept `className` prop for external styling via `cn()`
- Motion library for animations and transitions
- Lucide React icons for consistent iconography

<!-- MANUAL: -->
