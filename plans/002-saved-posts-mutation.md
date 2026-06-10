# Plan 002: Make the "save post" bookmark update immediately instead of mutating the profile prop

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 218b90f..HEAD -- src/pages/Feed.tsx src/pages/PostDetails.tsx src/contexts src/App.tsx`
> If any of these changed since this plan was written, compare the "Current
> state" excerpts against the live code before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `218b90f`, 2026-06-10

## Why this matters

When a user clicks the bookmark to save/unsave a post, the handler mutates the
`profile.savedPosts` array **in place** and never calls a React state setter.
Because the `profile` object reference does not change, React does not re-render,
so the bookmark icon's filled/unfilled state and the "Itens Salvos" counter in the
feed sidebar do not update until some unrelated render happens. For the target user
base (members aged 65–85), an action that produces no visible feedback reads as
"broken" and invites repeated clicks. The fix is to track saved-post IDs in real
React state so the UI reflects the toggle instantly, while keeping the server write
that already works.

## Current state

The bug appears in two handlers that mutate the `profile` prop directly.

`src/pages/Feed.tsx:82-94`:

```tsx
const toggleSaved = async (postId: string) => {
  try {
    await userService.toggleSavedPost(profile.id, postId);
    if (!profile.savedPosts) profile.savedPosts = [];
    if (profile.savedPosts.includes(postId)) {
      profile.savedPosts = profile.savedPosts.filter(id => id !== postId);
    } else {
      profile.savedPosts.push(postId);
    }
  } catch(err) {
    console.error(err);
  }
};
```

The same prop is read for rendering:
- `src/pages/Feed.tsx:254` — `{profile.savedPosts?.length || 0}` (sidebar counter)
- `src/pages/Feed.tsx:209` — `<PostCard ... onToggleSaved={toggleSaved} />`
- `src/components/feed/PostCard.tsx:21` — `const isSaved = profile.savedPosts?.includes(post.id);`
  then `src/components/feed/PostCard.tsx:79-83` render the bookmark with
  `fill={isSaved ? 'currentColor' : 'none'}`.

`src/pages/PostDetails.tsx` has the equivalent in-place mutation in its own
`toggleSaved` handler (around lines 43-56 — confirm exact lines during the drift
check). It reads `profile.savedPosts?.includes(post.id)` to render its bookmark.

The service call itself is correct and idempotent — `userService.toggleSavedPost`
(`src/services/userService.ts:117`) checks for an existing `saved_posts` row and
deletes or inserts accordingly. Keep calling it; only the local-state update is
wrong.

How `profile` reaches these pages: it is passed down from the authenticated layout
(see `src/App.tsx` / `src/layout/`). The simplest correct fix that does not require
re-plumbing the whole auth/profile flow is **component-local state for the set of
saved post IDs**, seeded from `profile.savedPosts`. Do NOT mutate the prop.

Conventions: hooks live in `src/hooks/`, are named `useX`, return component-ready
state, and wrap services (see `src/hooks/useFeed.ts` as the exemplar). Prefer a
small shared hook so Feed and PostDetails behave identically.

## Commands you will need

| Purpose   | Command                                  | Expected on success |
|-----------|------------------------------------------|---------------------|
| Typecheck | `npm run lint`                           | exit 0, no errors   |
| Tests     | `npm test`                               | all pass            |
| One file  | `npx vitest run src/hooks/useSavedPosts.test.ts` | new tests pass |
| Find prop mutation | `grep -rn "profile.savedPosts =" src/ ; grep -rn "savedPosts.push" src/` | no matches after the fix |

## Scope

**In scope** (the only files you should create/modify):
- `src/hooks/useSavedPosts.ts` (create)
- `src/hooks/useSavedPosts.test.ts` (create)
- `src/pages/Feed.tsx` (replace `toggleSaved` + saved-state reads)
- `src/pages/PostDetails.tsx` (replace its `toggleSaved` + saved-state read)
- `src/components/feed/PostCard.tsx` (accept the saved-state from the new source instead of reading `profile.savedPosts` directly)
- `plans/README.md` (status row only)

**Out of scope** (do NOT touch):
- The auth/profile context or `UserProfile` type — do not change how `profile`
  is loaded or its shape. `savedPosts` stays on the type for the initial seed.
- `src/services/userService.ts` — `toggleSavedPost` is correct.
- `src/pages/Profile.tsx`'s saved-posts list — it reads from a separate fetch;
  leave it unless the drift check shows it shares the mutated array (then STOP).

## Git workflow

- Branch: `advisor/002-saved-posts-mutation`
- Commit message style: conventional commits (e.g.
  `fix(feed): reflect save/unsave in UI without mutating profile prop`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create the `useSavedPosts` hook

Create `src/hooks/useSavedPosts.ts`. It owns a `Set<string>` (or string[]) of
saved post IDs seeded once from the initial profile, exposes whether a post is
saved, and a `toggle` that does an optimistic state update, calls the service, and
reverts on error.

Target shape (match repo style; adjust imports to actual paths):

```ts
import { useState, useCallback } from 'react';
import { userService } from '../services/userService';
import { useToast } from '../components/ui/Toast';

export function useSavedPosts(userId: string, initialSavedIds: string[] = []) {
  const { addToast } = useToast();
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set(initialSavedIds));

  const isSaved = useCallback((postId: string) => savedIds.has(postId), [savedIds]);

  const toggle = useCallback(async (postId: string) => {
    const wasSaved = savedIds.has(postId);
    // optimistic update
    setSavedIds(prev => {
      const next = new Set(prev);
      if (wasSaved) next.delete(postId); else next.add(postId);
      return next;
    });
    try {
      await userService.toggleSavedPost(userId, postId);
    } catch (err) {
      console.error(err);
      // revert
      setSavedIds(prev => {
        const next = new Set(prev);
        if (wasSaved) next.add(postId); else next.delete(postId);
        return next;
      });
      addToast('Não foi possível salvar a publicação. Tente novamente.', 'error');
    }
  }, [savedIds, userId, addToast]);

  return { isSaved, savedCount: savedIds.size, toggle };
}
```

Check the actual `useToast` API before using it — confirm with
`grep -n "addToast\|export function useToast\|export const useToast" src/components/ui/Toast.tsx`.
If the signature differs, match it; if there is no toast utility, drop the toast
line (keep the `console.error` revert).

**Verify**: `npm run lint` → exit 0.

### Step 2: Use the hook in `Feed.tsx`

In `src/pages/Feed.tsx`:
- Call `const saved = useSavedPosts(profile.id, profile.savedPosts ?? []);` near the
  other hooks.
- Delete the existing `toggleSaved` function (lines 82-94) entirely.
- Pass `saved.toggle` where `onToggleSaved={toggleSaved}` was (line ~209), i.e.
  `onToggleSaved={saved.toggle}`. Also pass saved-state into `PostCard` (see Step 4).
- Replace the sidebar counter `{profile.savedPosts?.length || 0}` (line ~254) with
  `{saved.savedCount}`.

**Verify**: `grep -n "profile.savedPosts =\|savedPosts.push\|savedPosts.filter" src/pages/Feed.tsx` → no matches.

### Step 3: Use the hook in `PostDetails.tsx`

Apply the same change in `src/pages/PostDetails.tsx`: seed `useSavedPosts` from
`profile.savedPosts`, delete the in-place mutation handler, render the bookmark
from `saved.isSaved(post.id)`, and wire the button to `saved.toggle`.

**Verify**: `grep -n "profile.savedPosts =\|savedPosts.push\|savedPosts.filter" src/pages/PostDetails.tsx` → no matches.

### Step 4: Make `PostCard` read saved-state from props, not the profile array

In `src/components/feed/PostCard.tsx`, `isSaved` is currently derived from
`profile.savedPosts?.includes(post.id)` (line 21). Add an `isSaved: boolean` prop
to `PostCardProps` and use it instead, with Feed passing
`isSaved={saved.isSaved(post.id)}`. (Keeping the `profile` prop is fine; just stop
deriving saved-state from its mutable array so the icon updates with the hook's
state.)

**Verify**: `grep -n "savedPosts" src/components/feed/PostCard.tsx` → no matches.

### Step 5: Full typecheck + tests

**Verify**:
- `npm run lint` → exit 0
- `npm test` → all pass (existing `PostCard.test.tsx` and `Feed.test.tsx` may need
  the new `isSaved` prop / no longer rely on the mutated array — update them
  minimally to pass the prop; if a test asserted the old mutation behavior, update
  it to assert the new state-driven behavior).

## Test plan

New file `src/hooks/useSavedPosts.test.ts`, modeled structurally after
`src/services/postoService.test.ts` (mock `../services/userService` with `vi.mock`).
Cover:
- **happy path — save**: starting empty, `toggle('p1')` makes `isSaved('p1')` true
  and `savedCount` 1, and `userService.toggleSavedPost` was called with `(userId, 'p1')`.
- **happy path — unsave**: seeded with `['p1']`, `toggle('p1')` makes `isSaved('p1')`
  false and `savedCount` 0.
- **the bug this fixes — error revert**: mock `toggleSavedPost` to reject;
  after `toggle('p1')`, `isSaved('p1')` returns to its pre-click value (no
  permanent optimistic state).
- **seed**: `useSavedPosts(id, ['a','b'])` reports `savedCount` 2 and
  `isSaved('a')` true.

Use `@testing-library/react`'s `renderHook` + `act` (already available — see
`src/hooks/useFeed.test.ts` for the import pattern).

Verification: `npx vitest run src/hooks/useSavedPosts.test.ts` → all pass; then
`npm test` → all pass.

## Done criteria

ALL must hold:

- [ ] `src/hooks/useSavedPosts.ts` and `src/hooks/useSavedPosts.test.ts` exist.
- [ ] `grep -rn "profile.savedPosts =\|savedPosts.push" src/` → no matches.
- [ ] `grep -n "savedPosts" src/components/feed/PostCard.tsx` → no matches.
- [ ] `npm run lint` exits 0.
- [ ] `npm test` exits 0 with the new `useSavedPosts` tests included and passing.
- [ ] `git status` shows no modified files outside the in-scope list.
- [ ] `plans/README.md` status row for 002 updated.

## STOP conditions

Stop and report back (do not improvise) if:

- `src/pages/Profile.tsx` turns out to read or mutate the SAME `profile.savedPosts`
  array for its saved-posts tab — coordinating that needs a wider decision.
- The `profile` prop is actually stored in a context that already exposes a setter
  for `savedPosts` — if so, report it; updating the context may be the better fix
  than local state.
- `useToast` does not exist or has an incompatible signature AND there is no other
  established toast/notification pattern — fall back to `console.error` only and note it.
- Tests fail twice after a reasonable fix attempt.

## Maintenance notes

- This hook holds saved-state per page mount, seeded from the profile snapshot. If
  the app later adds cross-page reactivity for saved posts (e.g. saving in Feed
  should reflect in an already-open Profile tab), promote this to a shared
  context/store. Note that explicitly so the next person doesn't assume global sync.
- Reviewer should confirm no remaining code reads `profile.savedPosts` for live UI
  state (only the initial seed is acceptable).
