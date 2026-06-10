<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-10 | Updated: 2026-06-10 -->

# feed

## Purpose
Feed-specific components for the main social timeline. Includes post cards, the TipTap rich text editor, reaction buttons, sidebar widgets, and admin alerts.

## Key Files

| File | Description |
|------|-------------|
| `PostCard.tsx` | Feed post card with content, author, reactions, comments |
| `PostEditor.tsx` | Rich text editor using TipTap (StarterKit + Placeholder) |
| `ReactionButtons.tsx` | Like/reaction buttons with count and toggle |
| `LeftSidebar.tsx` | Feed sidebar with filters, categories, navigation |
| `AdminAlertCard.tsx` | Admin announcement/info card for feed |
| `MemberSuggestionsCard.tsx` | Member suggestion sidebar widget |
| `PostoHighlightCard.tsx` | Featured diplomatic post highlight card |

## Tests

| File | Description |
|------|-------------|
| `PostCard.test.tsx` | Post card rendering and interaction tests |
| `PostEditor.test.tsx` | Editor initialization and content tests |
| `__tests__/PostEditor.test.tsx` | Additional editor test suite |

## For AI Agents

### Working In This Directory
- TipTap editor uses the `@tiptap/react` integration with StarterKit extensions
- Post content is HTML — sanitize with DOMPurify before rendering
- Reactions use optimistic updates for responsive UI

<!-- MANUAL: -->
