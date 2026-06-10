<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-10 | Updated: 2026-06-10 -->

# layout

## Purpose
Application layout and navigation components. Provides the structural shell around page content including the top navigation bar and global search.

## Key Files

| File | Description |
|------|-------------|
| `Navbar.tsx` | Top navigation bar with logo, links, search, user menu, admin links |
| `PageContainer.tsx` | Content area wrapper with consistent padding and max-width |
| `GlobalSearchDropdown.tsx` | Global search dropdown with cross-entity results |

## Tests

| File | Description |
|------|-------------|
| `Navbar.test.tsx` | Navbar rendering and navigation tests |
| `Navbar.scrolllock.test.tsx` | Navbar scroll-lock behavior tests |

## For AI Agents

### Working In This Directory
- Navbar is rendered on every authenticated page — changes affect global navigation
- Admin links are conditionally rendered based on `profile.role === 'ADMIN'`
- GlobalSearchDropdown uses the `useGlobalSearch` hook for cross-entity search

### Testing Requirements
- Navbar tests should cover collapsed/expanded states, admin visibility, and responsive behavior
- `Navbar.scrolllock.test.tsx` covers scroll-lock behavior on mobile menu open

<!-- MANUAL: -->
