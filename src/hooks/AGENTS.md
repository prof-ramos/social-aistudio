<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-10 | Updated: 2026-06-10 -->

# hooks

## Purpose
Custom React hooks that encapsulate business logic, Supabase Realtime subscriptions, and UI state management. Hooks serve as the bridge between service-layer data access and page-level composition.

## Key Files

| File | Description |
|------|-------------|
| `useFeed.ts` | Feed pagination, category filtering, editor modal state, real-time subscription |
| `usePostDetails.ts` | Single post with real-time comment subscription |
| `useNotifications.ts` | Notification list with unread count badge |
| `useChatConversation.ts` | Chat conversation with real-time message subscription |
| `useChatList.ts` | Chat session list management |
| `useUserProfile.ts` | Other users' profile lookup |
| `useEditProfile.ts` | Profile editing form state and submission |
| `useSavedPosts.ts` | Optimistic saved-post state and persistence |
| `useGlobalSearch.ts` | Cross-entity search with debounced input |
| `useAdminMembers.ts` | Member management for admin panel |
| `useAdminModeration.ts` | Report queue and moderation actions |
| `usePostos.ts` | Diplomatic posts listing with search |
| `usePostoDetails.ts` | Individual posto detail with reviews |
| `useUserContent.ts` | User's own posts and content management |
| `usePresence.ts` | Online presence tracking via Realtime |
| `useDarkMode.ts` | Dark mode toggle with system preference detection |
| `useConfirm.tsx` | Confirmation dialog hook with imperative API |
| `useFocusTrap.ts` | Focus trap for modals and dialogs |
| `useVisualViewportOffset.ts` | Visual viewport offset for mobile keyboard handling |

## Tests

| File | Description |
|------|-------------|
| `useFeed.test.ts` | Tests for feed pagination and filtering |
| `useAdminModeration.test.ts` | Tests for moderation actions |
| `useChatConversation.test.ts` | Tests for chat subscription |
| `useGlobalSearch.test.ts` | Tests for debounced search |

## For AI Agents

### Working In This Directory
- Hooks follow the `use` prefix naming convention
- Subscribe to Supabase Realtime channels in `useEffect`; return cleanup function
- Hooks return state objects, loading flags, and action functions
- Keep hooks focused — one hook per domain concern

### Common Patterns
- Pattern: `const { data, loading, error, refresh } = useEntity(params)`
- Error states returned alongside data, not thrown
- Realtime subscriptions cleaned up on unmount to prevent memory leaks

<!-- MANUAL: -->
