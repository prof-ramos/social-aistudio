# Social-ASOF: Stabilize & Expand Design

**Date:** 2026-06-09
**Approach:** Stabilize first — fix broken features, then improve quality, then expand
**User profile:** Mixed technical skill — UI must be intuitive, no dead-end interactions

---

## Phase 1: Fix What's Broken (Critical)

### 1.1 Global Search

**Problem:** Navbar search bar renders but has no logic — visual-only element.

**Solution:**

- New hook `useGlobalSearch.ts` — debounce 300ms, queries Supabase in parallel:
  - `posts` where title ILIKE `%query%` (limit 5)
  - `users` where displayName ILIKE `%query%` (limit 5)
  - `postos` where name ILIKE `%query%` (limit 5)
- New component `GlobalSearchDropdown.tsx` — grouped results (Membros, Posts, Postos)
- Navigation: member → `/perfil/:id`, post → `/feed/:id`, posto → `/postos/:slug`
- Keyboard: Escape closes, ArrowUp/Down navigates, Enter selects
- Click outside closes dropdown
- Minimum 2 characters to search, empty state shows "Digite para buscar..."

**No new service** — direct Supabase queries in the hook. Refactor to service only if reuse is needed later.

### 1.2 Mark Messages as Read

**Problem:** `chatService.markMessagesAsRead` exists but is never called. Messages show no read/unread distinction.

**Solution:**

- `useChat` hook: call `chatService.markMessagesAsRead(chatId, userId)` when opening a conversation
- In real-time subscription: when new messages arrive for the currently open chat, mark them as read automatically
- UI: add unread indicator in conversation list (bold text or dot badge)
- Filter: only mark messages where `read === false` and `senderId !== currentUserId`

### 1.3 Admin Content Removal

**Problem:** AdminModeration can resolve reports as "REMOVIDO" but does not actually remove the content.

**Solution:**

- `postService.deletePost(postId)` — soft delete (set `deleted_at` timestamp)
- `postService.deleteComment(commentId)` — same pattern
- AdminModeration: when resolving with status `RESOLVED_REMOVED`, call appropriate delete method
- Feed and post detail: filter records where `deleted_at` is not null
- RLS: only admins can set `deleted_at`; authors can delete their own content

### 1.4 Fix PostoHighlightCard

**Problem:** Entirely hardcoded to "Posto: Genebra" with static data. "Atualizar Ficha" button has no handler.

**Solution:**

- Replace hardcoded data with dynamic query: fetch posto with highest average review rating (or most reviews), fallback to most recently updated posto
- Remove "Atualizar Ficha" button or link it to the posto's detail page
- Show review count and average rating from real data

### 1.5 Fix Hardcoded Sidebar Data

**Problem:** LeftSidebar shows hardcoded post count (12) and static "Proximo Plantao" widget.

**Solution:**

- Post count: use `profile.postsCount` if available, otherwise count via Supabase query on posts table
- "Proximo Plantao": remove the widget entirely (no dynamic shift data exists)

---

## Phase 2: Quality Improvements (High)

### 2.1 ReportDialog Component

**Problem:** Report flow uses native `prompt()` in `usePostDetails.ts` and `usePostoDetails.ts`.

**Solution:**

- New component `ReportDialog.tsx` — modal with:
  - Reason select: "Spam", "Conteudo ofensivo", "Informacao falsa", "Outro"
  - Textarea for details
  - Cancel and Submit buttons
- Props: `targetType` (post/comment/posto_field), `targetId`, `onClose`
- Replace both `prompt()` calls with this component

### 2.2 Consistent Dark Mode

**Problem:** Only auth shell CSS variables swap in dark mode. Most components use hardcoded Tailwind colors without `dark:` variants.

**Solution:**

- Verify `tailwind.config` has `darkMode: 'class'`
- Migrate priority components to Tailwind `dark:` variants:
  - Navbar, PostCard, Messages, PostoDetails, Profile (most-used pages)
- Remove manual CSS variable overrides in `.dark` class from `index.css`
- Keep the toggle mechanism as-is (class on `<html>` element)

### 2.3 Login Firebase Reference

**Problem:** Login error message references "Firebase Console" and "colecao users" — outdated after Supabase migration.

**Solution:**

- Update error text to: "Contate o administrador do sistema para obter acesso."

### 2.4 Sidebar Anchor Links

**Problem:** LeftSidebar quick links point to `/perfil/:id#posts` and `/perfil/:id#salvos` but Profile page has no matching element IDs.

**Solution:**

- Add `id="posts"` to the posts section header in Profile page
- Add `id="salvos"` to the saved posts section header in Profile page

### 2.5 Posto Field Author Attribution

**Problem:** Posto field reports show generic "Relato do Colega" instead of actual author name.

**Solution:**

- Join posto fields query with `users` table to fetch `displayName`
- Display actual author name in the field report card
- Fallback: if user profile not found, show "Membro"

### 2.6 Profile Type Safety

**Problem:** `useProfile.ts` uses `as any` casts for `currentPost` and `interests` fields.

**Solution:**

- Update `UserProfile` type to include `currentPost` and `interests` with correct shapes
- Remove `as any` casts from the hook

---

## Phase 3: Expansion

### 3.1 Carreira e Promocao Page

**Route:** `/carreira`
**Component:** `CarreiraPromocao.tsx`

Structure with 3 sections (all placeholder content, CMS-ready layout):
- **Editais** — card list with title + date + link (empty state: "Nenhum edital disponivel")
- **Regras e Normas** — accordion/list of links (empty state: "Em breve")
- **Perguntas Frequentes** — collapsible FAQ items with static example content

No new service — data lives in the component. Refactor to service when real content arrives.

### 3.2 Aposentadoria Page

**Route:** `/aposentadoria`
**Component:** `Aposentadoria.tsx`

Structure with 3 sections:
- **Guias e Documentos** — link list (empty state placeholder)
- **Simulador** — placeholder card "Em breve: simulador de aposentadoria"
- **Noticias** — simple card list (empty state placeholder)

Same approach: no service, data in component.

### 3.3 Posto Reviews

**Problem:** `postoService.subscribeToPostoReviews` and `createReview` exist but are never called.

**Solution:**

- Add "Avaliacoes" section to `PostoDetails.tsx` below field reports
- Subscribe to reviews with `subscribeToPostoReviews(postoId)`
- Inline form: star rating (1-5) + text area, submit via `createReview`
- Show average rating and count in posto header
- Only authenticated members can review (not PENDENTE role)

### 3.4 Post Editing and Deletion

**New service methods:**
- `postService.updatePost(postId, { title, content, category })`
- `postService.deletePost(postId)` — soft delete (set `deleted_at`)

**UI:**
- PostCard: edit icon (pencil) and delete icon (trash) visible to post author and admins
- Edit: opens PostEditor in edit mode (pre-filled with existing data)
- Delete: ConfirmDialog before executing

### 3.5 Avatar Upload

**Prerequisites:**
- Create `avatars` bucket in Supabase Storage (public read, authenticated write)

**New service method:**
- `userService.uploadAvatar(file)` — upload to `avatars/{uid}/{timestamp}.ext`, return public URL
- Resize to max 200x200 before upload (client-side canvas resize)

**Component:**
- `AvatarUpload.tsx` — drag & drop or click to select, preview before upload
- Integrate into Profile edit modal, replacing the current URL text input

---

## Error Handling

- All new Supabase calls follow existing pattern: try/catch with toast error messages
- File upload: validate file type (jpg, png, webp) and size (max 2MB) before upload
- Soft deletes: use `deleted_at` timestamp, never hard-delete records

## Testing

- Unit tests for new hooks (`useGlobalSearch`, updated `useChat`)
- Component tests for `GlobalSearchDropdown`, `ReportDialog`, `AvatarUpload`
- Integration test for admin content removal flow
- Existing tests must continue to pass after each phase

## Scope Boundaries

- No group chat (1:1 only, as currently designed)
- No notification on comment/reaction (only @mentions, as currently designed)
- No admin user management beyond content removal (minimum essential)
- Carreira/Aposentadoria pages are structure-only with placeholder content