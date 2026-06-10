<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-10 | Updated: 2026-06-10 -->

# services

## Purpose
Data access layer encapsulating all Supabase SDK interactions. Services are plain objects (not classes) that provide CRUD operations, real-time subscriptions, and authentication flows. This is the only layer that directly interacts with external APIs.

## Key Files

| File | Description |
|------|-------------|
| `authService.ts` | Supabase Auth — signIn, signOut, password reset, auth-state listener |
| `postService.ts` | Post CRUD, feed queries, reactions, comments, mention notifications |
| `postRepository.ts` | Lower-level post data access with optimized queries |
| `chatService.ts` | Real-time messaging and chat session management |
| `notificationService.ts` | Notification CRUD with unread counts |
| `notificationOrchestrator.ts` | Cross-service notification coordination |
| `userService.ts` | User profile lookup, presence updates, saved posts |
| `adminService.ts` | Admin operations — member approvals, content moderation |
| `memberRequestService.ts` | Access request workflow management |
| `postoService.ts` | Diplomatic post data, reviews, and field reports |
| `reportService.ts` | Content reporting system |
| `searchService.ts` | Cross-entity search across posts, users, postos |
| `systemService.ts` | Connectivity and health checks |

## Tests

| File | Description |
|------|-------------|
| `postService.test.ts` | Tests for post service CRUD |
| `postRepository.test.ts` | Tests for repository layer |
| `postoService.test.ts` | Tests for diplomatic post service |
| `reactionRepository.test.ts` | Tests for reaction data access |
| `searchService.test.ts` | Tests for search functionality |
| `notificationOrchestrator.test.ts` | Tests for notification orchestration |

## For AI Agents

### Working In This Directory
- Services are plain objects, not class instances
- Each service file focuses on one domain entity
- Supabase client is initialized in `src/lib/supabase.ts` and imported here
- Real-time subscriptions return unsubscribe functions for cleanup

### Common Patterns
- Service functions are async and return typed results
- Error handling is done at the service level, not propagated as thrown exceptions
- RLS policies control data access — services do not bypass auth
- Queries use Supabase JS SDK builder pattern

<!-- MANUAL: -->
