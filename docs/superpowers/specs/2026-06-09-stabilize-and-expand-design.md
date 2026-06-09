# Social-ASOF: Stabilize & Expand — Implementation Plan

**Date:** 2026-06-09 (Revision 3 — consensus-approved)
**Approach:** Database prerequisites first, then fix broken features, then quality, then expand
**Stack:** Supabase only. No Firebase remains. All services use `src/lib/supabase.ts`.

---

## Phase 0: Database Prerequisites

All subsequent phases depend on these schema and policy changes.

### 0.1 Migration: Add `deleted_at` + `rating` columns

**File:** `supabase/migrations/20260609000000_add_soft_delete_and_rating.sql`

- Add `deleted_at TIMESTAMPTZ` nullable to `posts`, `comments`, and `posto_fields`.
- Add `rating INT` nullable (CHECK 1-5) to `reviews` table (enables star ratings for posto reviews).

**Acceptance Criteria:**
- AC1: `SELECT column_name FROM information_schema.columns WHERE table_name IN ('posts','comments','posto_fields') AND column_name = 'deleted_at'` returns 3 rows.
- AC2: `SELECT column_name FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'rating'` returns 1 row.
- AC3: Existing rows have `deleted_at = NULL`; no data loss.

**Verification:**
- Run migration via `supabase db push` or SQL Editor.
- `SELECT count(*) FROM posts WHERE deleted_at IS NOT NULL;` → returns 0.
- `npm run lint` — no type errors.

### 0.2 RLS Policies: UPDATE for soft-delete

**File:** Same migration `20260609000000_add_soft_delete_and_rating.sql`

Current state: `posts` has UPDATE policy for authors (own posts). `comments` has NO UPDATE policy at all. Add:
- `comments` UPDATE policy: authors can update own comments, admins can update any comment.
- Both `posts` and `comments`: modify existing SELECT policies to exclude `deleted_at IS NOT NULL` rows.
- `posto_fields`: same SELECT exclusion + admin/author UPDATE policy.

```sql
-- Comments: authors and admins can UPDATE (for soft-delete)
CREATE POLICY "Authors update own comments" ON comments
  FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Admins update any comment" ON comments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Posts: modify SELECT to exclude soft-deleted
DROP POLICY IF EXISTS "Users can view all posts" ON posts;
CREATE POLICY "Users can view all posts" ON posts
  FOR SELECT USING (deleted_at IS NULL);

-- Comments: SELECT excludes soft-deleted
CREATE POLICY "Users can view all comments" ON comments
  FOR SELECT USING (deleted_at IS NULL);

-- Posto fields: SELECT excludes soft-deleted + UPDATE for admin/author
CREATE POLICY "Users can view posto fields" ON posto_fields
  FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Authors update own posto fields" ON posto_fields
  FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Admins update any posto field" ON posto_fields
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
  );
```

**Acceptance Criteria:**
- AC1: Non-admin user cannot set `deleted_at` on another user's post (RLS blocks).
- AC2: Admin can set `deleted_at` on any post/comment/posto_field.
- AC3: Author can set `deleted_at` on own post/comment.
- AC4: Soft-deleted content is invisible to SELECT from any role.

**Verification:**
- Manual: sign in as admin, soft-delete a post via Supabase client, verify it disappears from feed.
- Manual: sign in as member, attempt to soft-delete another user's comment — expect RLS error.
- Test: `src/services/postService.test.ts` — verify `softDeletePost` sets `deleted_at`.

### 0.3 RLS Policy + Trigger: Chat Read Receipts

**File:** `supabase/migrations/20260609000100_chat_read_receipts.sql`

**RLS:** Add UPDATE policy on `chat_messages` for recipients:
```sql
CREATE POLICY "Recipients mark messages as read" ON chat_messages
  FOR UPDATE USING (
    sender_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_id = chat_messages.chat_id AND user_id = auth.uid()
    )
  ) WITH CHECK (true);
```

**Trigger:** Decrement `chat_participants.unread_count` when messages are marked read:
```sql
CREATE OR REPLACE FUNCTION decrement_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.read = true AND OLD.read = false THEN
    UPDATE chat_participants
    SET unread_count = GREATEST(unread_count - 1, 0)
    WHERE chat_id = NEW.chat_id AND user_id != NEW.sender_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_message_read
  AFTER UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION decrement_unread_count();
```

**Acceptance Criteria:**
- AC1: Recipient can UPDATE `read` to `true` on messages they did not send.
- AC2: After marking messages as read, `chat_participants.unread_count` is decremented.
- AC3: Sender cannot UPDATE `read` on their own messages.

**Verification:**
- Manual: open conversation as recipient, call `markMessagesAsRead`, verify `unread_count` decreases in `chat_participants`.
- Manual: as sender, attempt to update `read` — expect RLS error.
- Test: `src/services/chatService.test.ts` — verify `markMessagesAsRead` succeeds for recipient.

### 0.4 Storage Bucket for Avatars

**Via Supabase Dashboard or CLI:**

Create `avatars` bucket: public read, authenticated upload. Storage policy:
- Public bucket (anyone can read).
- INSERT/UPDATE: only authenticated users, path must start with their `uid/`.

**Acceptance Criteria:**
- AC1: Unauthenticated user can GET a file from `avatars`.
- AC2: Authenticated user can upload to `avatars/{their_uid}/filename`.
- AC3: Authenticated user cannot upload to `avatars/{other_uid}/filename`.

**Verification:**
- Upload test image via Dashboard to `avatars/test-uid/test.jpg`, verify public URL works.
- Attempt upload to wrong uid prefix — expect policy denial.

### 0.5 Alternative Evaluation: Database-Level vs Application-Layer

**Why RLS + triggers (not app-layer filtering):**
- **Defense-in-depth:** RLS enforces access at the DB level. Service bugs (forgotten filters) don't leak soft-deleted data.
- **Realtime consistency:** Supabase Realtime delivers whatever the DB allows. Without RLS filtering `deleted_at IS NULL`, realtime subscriptions would re-surface deleted content.
- **Audit trail:** `deleted_at` preserves records; hard-delete loses them.
- **Unread count integrity:** Database triggers guarantee `unread_count` stays in sync; client-side decrements are unreliable (page reloads, race conditions).
- **Consistency:** All 10 existing services rely on RLS for access control. Mixing approaches creates an inconsistent security model.

**Trade-off:** RLS policies and triggers are harder to debug (silent denials). Mitigation: log `error.code === '42501'` explicitly in service methods.

---

## Phase 1: Fix What's Broken

### Merge Conflict Resolution Order

**1.5 before 1.1** — Task 1.5 removes a static widget from `App.tsx` (smaller, isolated). Task 1.1 adds search dropdown to `Navbar.tsx` (larger change). Doing 1.5 first gives 1.1 a clean working state.

### 1.5 Fix Hardcoded Sidebar Data

**Files:** `src/App.tsx` (remove "Próximo Plantão"), `src/components/feed/LeftSidebar.tsx` (dynamic post count), `src/services/postService.ts` (add `getUserPostCount`)

- Remove "Próximo Plantão" widget from `App.tsx` sidebar.
- Replace hardcoded `12` in LeftSidebar with real post count via `postService.getUserPostCount(uid)`.
- Fallback: `--` if count unavailable.

**Acceptance Criteria:**
- AC1: "Próximo Plantão" widget no longer appears.
- AC2: Post count matches `SELECT count(*) FROM posts WHERE author_id = '<uid>' AND deleted_at IS NULL`.
- AC3: User with 0 posts sees `0`, not `12`.

**Verification:**
- Manual: load Feed, check sidebar post count matches direct DB query.
- Grep: `grep -rn "Próximo Plantão\|Proximo Plantao" src/` — zero results.
- `npm run lint`.

### 1.1 Global Search

**Files:** `src/services/searchService.ts` (new), `src/hooks/useGlobalSearch.ts` (new), `src/components/layout/GlobalSearchDropdown.tsx` (new), `src/components/layout/Navbar.tsx`

- New `searchService.ts` with `searchAll(query: string)` — queries `users`, `posts`, `postos` via Supabase `ilike`. Returns `{ users, posts, postos }`.
- New `useGlobalSearch.ts` hook — 300ms debounce, min 2 chars, calls `searchService.searchAll`.
- New `GlobalSearchDropdown.tsx` — grouped results, keyboard nav (Escape/Arrow/Enter), click-outside close.
- Wire into Navbar.tsx existing search input.

**Acceptance Criteria:**
- AC1: Typing "gen" returns matching users, posts, postos within 500ms.
- AC2: Escape closes dropdown; ArrowDown/Up cycles; Enter navigates.
- AC3: <2 chars shows "Digite pelo menos 2 caracteres...".
- AC4: Empty results show "Nenhum resultado encontrado."

**Verification:**
- Manual: type in search bar, verify dropdown with grouped results.
- Manual: keyboard navigation test (Escape, Arrow, Enter).
- Test: `src/services/searchService.test.ts` — verify `searchAll` structure.
- Test: `src/hooks/useGlobalSearch.test.ts` — verify debounce and threshold.
- `npm run lint`.

### 1.2 Mark Messages as Read

**Files:** `src/hooks/useChatList.ts` (new, extracted from Messages.tsx), `src/hooks/useChatConversation.ts` (new, extracted from Messages.tsx), `src/pages/Messages.tsx` (refactored to use hooks)

**Note:** No `useChat` hook file exists. The work is extracting inline state from `Messages.tsx:11-55` into two new hooks.

- `useChatList(profileId)` — manages chat list subscription, exposes `chats` with `unreadCount` from `chat_participants`.
- `useChatConversation(chatId, profileId)` — manages message subscription, calls `chatService.markMessagesAsRead(chatId, userId)` on open and on new incoming messages. The `unread_count` decrement is handled by the Phase 0.3 database trigger.
- UI: unread badge (count from `chat_participants.unread_count`) in conversation list.

**Depends on:** Phase 0.3.

**Acceptance Criteria:**
- AC1: Opening a conversation marks unread messages as `read = true`.
- AC2: `chat_participants.unread_count` decrements (via trigger) after marking read.
- AC3: Conversation list shows unread count badge that clears after opening.
- AC4: New messages in active chat are immediately marked read.

**Verification:**
- Manual: User A sends message, User B opens chat, verify `read = true` and `unread_count = 0` in DB.
- Manual: verify unread badge disappears after opening.
- Test: `src/hooks/useChatConversation.test.ts` — mock `markMessagesAsRead`, verify call on open.

### 1.3 Admin Content Removal

**Files:** `src/services/postService.ts`, `src/services/adminService.ts`, `src/hooks/useAdminModeration.ts`, `src/pages/AdminModeration.tsx`

- Add `postService.softDeletePost(postId)` — sets `deleted_at = now()`.
- Add `postService.softDeleteComment(commentId)` — same pattern.
- Add `postoService.softDeleteField(fieldId)` — same pattern.
- In `useAdminModeration`: when `action === 'RESOLVED_REMOVED'`, call appropriate soft-delete.
- Pass `notes` to `adminService.updateReportStatus(id, action, notes)` (currently lost).
- Soft-deleted content excluded from queries via RLS (Phase 0.2), no client filter needed.

**Depends on:** Phase 0.1, 0.2.

**Acceptance Criteria:**
- AC1: Admin resolving report as "Removido" sets `deleted_at` and content disappears from feed.
- AC2: Non-admin cannot soft-delete another's content (RLS blocks).
- AC3: Soft-deleted content persists in DB (`SELECT * FROM posts WHERE deleted_at IS NOT NULL` returns row).
- AC4: Report notes are persisted.

**Verification:**
- Manual: as admin, resolve report with "Removido", verify post disappears.
- Manual: check DB — `deleted_at` is set, notes are saved.
- Test: `src/hooks/useAdminModeration.test.ts` — verify handleResolve calls softDelete.

### 1.4 Fix PostoHighlightCard

**Files:** `src/components/feed/PostoHighlightCard.tsx`, `src/services/postoService.ts`

- Replace hardcoded "Genebra" with dynamic query: fetch posto with most reviews (or highest average rating if `rating` column has data), fallback to most recently updated.
- Remove "Atualizar Ficha" button or link to `/postos/{slug}`.
- Show real review count. If `rating` data exists, show average rating.

**Depends on:** Phase 0.1 (rating column in reviews).

**Acceptance Criteria:**
- AC1: Card displays a real posto name from DB, not "Genebra".
- AC2: Review count comes from `reviews` table, not hardcoded.
- AC3: When no reviews exist, card shows fallback ("Nenhum posto avaliado ainda").
- AC4: "Atualizar Ficha" links to `/postos/{slug}` or is removed.

**Verification:**
- Manual: load Feed, verify highlight card shows real posto.
- Manual: delete all reviews, verify fallback state.
- `npm run lint`.

### 1.6 Profile Type Safety

**Files:** `src/hooks/useProfile.ts`

- Remove `as any` casts at lines 36-37 and 69. `UserProfile` already has `currentPost?: string` and `interests?: string`.

**Acceptance Criteria:**
- AC1: No `as any` casts in `useProfile.ts`.
- AC2: `npm run lint` passes.
- AC3: Profile editing still works.

**Verification:**
- `npm run lint` — zero errors.
- Manual: edit profile, save, verify persistence.

---

## Phase 2: Quality

### 2.1 ReportDialog Component

**Files:** `src/components/ui/ReportDialog.tsx` (new), `src/hooks/usePostDetails.ts`, `src/hooks/usePostoDetails.ts`, `src/pages/PostDetails.tsx`, `src/pages/PostoDetails.tsx`

- New `ReportDialog.tsx` — modal with reason select (Spam, Conteúdo ofensivo, Informação falsa, Outro), details textarea, Cancel/Submit.
- Replace `prompt()` calls in both hooks with state-driven dialog.
- Reuses `ConfirmDialog` pattern (focus trap, escape, backdrop).

**Acceptance Criteria:**
- AC1: "Denunciar" opens modal, not `prompt()`.
- AC2: Submitting creates a report with reason and details.
- AC3: Canceling dismisses without creating report.

**Verification:**
- Manual: trigger report on a post, verify modal, submit, check DB.
- Test: `src/components/ui/ReportDialog.test.tsx` — render, submit, verify callback.
- `npm run lint`.

### 2.2 Dark Mode Audit

**Files:** `src/index.css` (minor, if needed), any components using raw Tailwind colors

**Strategy: The CSS variable swap system already works.** The `@theme` block maps token classes (`bg-ice`, `text-navy`, `bg-white`, etc.) to `--app-*` variables, and `.dark` swaps them. Components using these tokens already respond to dark mode.

**What to do:**
- Audit all components for raw Tailwind color classes that bypass the variable system (`bg-gray-*`, `text-gray-*`, `bg-slate-*`, etc. — not in `@theme` block).
- Replace with semantic token classes that already respond to dark mode.
- Do NOT add `@custom-variant dark`. Do NOT remove `.dark` CSS variable overrides. Do NOT add `dark:` variants.
- The only `dark:` variant in the codebase (`ReactionButtons.tsx:68`) should be migrated to use the variable system if possible.

**Acceptance Criteria:**
- AC1: `grep -rn "bg-gray-\|text-gray-\|bg-slate-\|text-slate-" src/` returns zero results for raw Tailwind colors (not `--app-slate` mapped ones).
- AC2: Top 10 pages render correctly in dark mode (visual inspection).
- AC3: No `@custom-variant dark` added to CSS.
- AC4: `.dark` CSS variable overrides remain in `index.css`.

**Verification:**
- Grep for raw Tailwind colors — zero results.
- Manual: toggle dark mode, visually inspect Feed, Messages, PostDetails, Profile, Postos, AdminMembers, AdminModeration, Notifications, Login, PostoDetails.
- `npm run lint`.

### 2.3 Login Error Message — Remove Firebase Reference

**Files:** `src/pages/Login.tsx`

- Update error text to: "Credenciais inválidas. Verifique seu e-mail e senha. Se ainda não tem acesso, solicite em 'Solicitar Acesso'."

**Acceptance Criteria:**
- AC1: `grep -i "firebase" src/pages/Login.tsx` returns zero results.
- AC2: Error message is concise and actionable.

**Verification:**
- Grep for "Firebase" — zero results.
- Manual: trigger login error, verify message.

### 2.4 CLAUDE.md Stack Identity Update

**Files:** `CLAUDE.md`

- Replace all Firebase references with Supabase equivalents.
- Update architecture section, env vars, service descriptions.

**Acceptance Criteria:**
- AC1: `grep -ic "firebase" CLAUDE.md` returns 0.
- AC2: Environment variables list `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- AC3: Architecture section documents Supabase, not Firebase.

**Verification:**
- Grep for "firebase" — zero results.
- Manual review of CLAUDE.md.

### 2.5 Sidebar Anchor Links

**Files:** `src/pages/Profile.tsx`

- Add `id="posts"` and `id="salvos"` to appropriate section headers.
- Add scroll-to-hash effect on page load.

**Acceptance Criteria:**
- AC1: `/perfil/:id#posts` scrolls to posts section.
- AC2: `/perfil/:id#salvos` scrolls to saved posts section.

**Verification:**
- Manual: click sidebar quick links, verify scroll.

### 2.6 Posto Field Author Attribution

**Files:** `src/services/postoService.ts`, `src/pages/PostoDetails.tsx`

- Join `posto_fields` query with `users` table: `.select('*, users!author_id(name, role)')`.
- Display author name. Fallback: "Membro".

**Acceptance Criteria:**
- AC1: Field reports show real author name, not "Relato do Colega".
- AC2: Missing user falls back to "Membro".
- AC3: Join is via Supabase select (not N+1 queries).

**Verification:**
- Manual: open posto detail, verify author names.
- Test: `src/services/postoService.test.ts` — verify join returns author.

---

## Phase 3: Expansion

### 3.1 Carreira e Promoção Page

**Files:** `src/pages/CarreiraPromocao.tsx` (new), `src/App.tsx` (route + enable sidebar link)

- Route: `/carreira`. Structure-only with 3 sections: Editais, Regras e Normas, FAQ.
- Enable sidebar link (remove `cursor-not-allowed`).
- No service — data in component.

**Acceptance Criteria:**
- AC1: `/carreira` renders with 3 sections and empty states.
- AC2: Sidebar link navigates to `/carreira`.
- AC3: `npm run lint` passes.

**Verification:**
- Manual: click sidebar link, verify page.
- `npm run lint`.

### 3.2 Aposentadoria Page

**Files:** `src/pages/Aposentadoria.tsx` (new), `src/App.tsx` (route + enable sidebar link)

- Route: `/aposentadoria`. Structure: Guias, Simulador placeholder, Notícias.
- Enable sidebar link.

**Acceptance Criteria:**
- AC1: `/aposentadoria` renders with 3 sections and empty states.
- AC2: Sidebar link navigates to `/aposentadoria`.
- AC3: `npm run lint` passes.

**Verification:**
- Manual: click sidebar link, verify page.
- `npm run lint`.

### 3.3 Posto Reviews

**Files:** `src/pages/PostoDetails.tsx`, `src/hooks/usePostoDetails.ts`

- Add "Avaliações" section below field reports.
- Subscribe via `postoService.subscribeToPostoReviews(postoId)`.
- Inline form: star rating 1-5 (uses `rating` column from Phase 0.1) + text area, submit via `createReview`.
- Show average rating and count in posto header.
- Only non-PENDENTE members can review.

**Depends on:** Phase 0.1 (rating column).

**Acceptance Criteria:**
- AC1: PostoDetails shows "Avaliações" section with real reviews.
- AC2: Submitting a review creates a row in `reviews` with `rating` value.
- AC3: Average rating and count display in posto header.
- AC4: PENDENTE users cannot submit review.

**Verification:**
- Manual: submit a review, verify it appears.
- Manual: as PENDENTE, verify form is hidden.
- Test: `src/hooks/usePostoDetails.test.ts` — verify review subscription.

### 3.4 Post Editing and Deletion

**Files:** `src/services/postService.ts`, `src/components/feed/PostCard.tsx`, `src/components/feed/PostEditor.tsx`, `src/pages/PostDetails.tsx`, `src/hooks/usePostDetails.ts`

- `postService.updatePost(postId, { title, body, category })`.
- `postService.softDeletePost(postId)` — uses Phase 0 soft-delete.
- PostCard: edit/delete icons for author + admin.
- Edit: opens PostEditor in edit mode.
- Delete: ConfirmDialog before executing.

**Depends on:** Phase 0.1, 0.2.

**Acceptance Criteria:**
- AC1: Author can edit own post — changes persist in DB.
- AC2: Author and admin see edit/delete icons.
- AC3: Deleting shows confirm dialog, then sets `deleted_at`.
- AC4: Non-author non-admin sees no edit/delete icons.

**Verification:**
- Manual: edit a post, save, verify update.
- Manual: delete a post, confirm, verify disappearance.
- Test: `src/services/postService.test.ts` — verify `updatePost` and `softDeletePost`.

### 3.5 Avatar Upload

**Files:** `src/services/userService.ts`, `src/components/ui/AvatarUpload.tsx` (new), `src/pages/Profile.tsx`

- `userService.uploadAvatar(file)` — upload to `avatars/{uid}/{timestamp}.ext`, return public URL.
- Client-side canvas resize to max 200x200.
- `AvatarUpload.tsx` — drag-drop or click, preview, validate (jpg/png/webp, max 2MB).
- Replace URL text input in Profile edit with AvatarUpload.

**Depends on:** Phase 0.4.

**Acceptance Criteria:**
- AC1: Upload creates file in `avatars` bucket and updates `avatar_url`.
- AC2: Profile displays uploaded avatar.
- AC3: Invalid file types rejected with toast.
- AC4: Files over 2MB rejected with toast.

**Verification:**
- Manual: upload avatar, verify image appears and persists.
- Manual: attempt .pdf and 5MB file, verify rejection.
- Test: `src/components/ui/AvatarUpload.test.tsx` — verify validation.

---

## Risk Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration breaks DB | High | Test locally (`supabase db reset`). Keep migration idempotent (IF NOT EXISTS). Backup via `pg_dump` before production. Rollback: `ALTER TABLE posts DROP COLUMN deleted_at;` |
| RLS denies legitimate queries | High | After each Phase 0 migration, verify all CRUD ops in running app. Log `error.code === '42501'` in services. |
| Merge conflict 1.5/1.1 | Medium | Execute 1.5 first. If conflict, take 1.5 sidebar removal + 1.1 search dropdown addition. |
| Storage bucket not configured | Medium | Fallback to URL-based avatars (current mechanism) if bucket creation fails. |
| Dark mode audit finds many raw colors | Low | Audit first, then fix incrementally. Most components already use token classes. |
| `as any` removal causes type errors | Low | Types already match. Run `npm run lint` immediately after. |

---

## Dependency Graph

```
Phase 0.1 (deleted_at + rating columns)
  ├── Phase 0.2 (RLS for soft-delete) ──► Phase 1.3, Phase 3.4
  └── Phase 0.1 (rating column) ──► Phase 1.4, Phase 3.3

Phase 0.3 (chat read RLS + trigger) ──► Phase 1.2
Phase 0.4 (avatars bucket) ──► Phase 3.5

Phase 1.5 (sidebar) ──► Phase 1.1 (search)
Phase 2.2 (dark mode audit) — independent
Phase 2.1, 2.3-2.6 — independent
Phase 3.1, 3.2 — independent
```

## Execution Waves

| Wave | Tasks | Rationale |
|------|-------|-----------|
| W1 | 0.1, 0.3, 0.4 | DB prerequisites — independent |
| W2 | 0.2 | Depends on 0.1 |
| W3 | 1.5, 1.4, 1.6, 2.1, 2.3, 2.4, 2.5, 2.6 | Independent fixes — parallel |
| W4 | 1.1, 1.2 | 1.1 after 1.5; 1.2 after 0.3 |
| W5 | 1.3 | After 0.2 |
| W6 | 2.2 | Dark mode audit |
| W7 | 3.1, 3.2, 3.3 | Expansion — parallel |
| W8 | 3.4, 3.5 | After Phase 0 dependencies |

## Scope Boundaries

- No group chat (1:1 only).
- No notification on comment/reaction (only @mentions).
- No admin user management beyond content removal.
- Carreira/Aposentadoria pages are structure-only.