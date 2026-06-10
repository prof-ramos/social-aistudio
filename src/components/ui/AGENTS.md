<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-10 | Updated: 2026-06-10 -->

# ui

## Purpose
Reusable UI primitive components used throughout the application. Forms the design system's component library with accessible, consistent building blocks.

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | Barrel export for all UI components |
| `Button.tsx` | Primary action button with variants and loading state |
| `Card.tsx` | Content container card |
| `Toast.tsx` | Toast notification display |
| `ConfirmDialog.tsx` | Confirmation modal dialog |
| `ReportDialog.tsx` | Content reporting modal |
| `Alert.tsx` | Inline alert/notification banner |
| `Breadcrumb.tsx` | Navigation breadcrumb trail |
| `Checkbox.tsx` | Styled checkbox input |
| `Skeleton.tsx` | Loading skeleton placeholder |
| `LoadingUI.tsx` | Full-area loading indicator |
| `StatusBadge.tsx` | Status indicator badge |
| `PageTitle.tsx` | Page heading with metadata |
| `KeyboardShortcuts.tsx` | Keyboard shortcut overlay |
| `OfflineIndicator.tsx` | Offline connectivity banner |
| `AvatarUpload.tsx` | Avatar image upload with preview |

## Tests

| File | Description |
|------|-------------|
| `Button.test.tsx` | Button rendering and interaction tests |
| `ReportDialog.test.tsx` | Report dialog behavior tests |
| `AvatarUpload.test.tsx` | Avatar upload flow tests |

## For AI Agents

### Working In This Directory
- All components accept `className` prop for external styling via `cn()`
- Use Motion library for enter/exit animations
- Components must be accessible — proper ARIA roles, keyboard navigation, focus management
- Export from `index.ts` for clean imports

### Common Patterns
- Props interface exported alongside each component
- Forward refs for components that need DOM access (Button, Input variants)
- Loading, empty, and error states handled within each component where applicable
- Lucide React icons for all iconography

<!-- MANUAL: -->
