# Plan 004: Stop the feed from refetching every post + all reactions on every global posts/reactions change

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 218b90f..HEAD -- src/services/postRepository.ts src/services/postService.ts src/services/reactionRepository.ts src/hooks/useFeed.ts`
> If any changed since this plan was written, compare the "Current state"
> excerpts against the live code before proceeding; on a mismatch, treat it as
> a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none (but coordinate with 002 if both touch `useFeed` — they do not overlap)
- **Category**: perf
- **Planned at**: commit `218b90f`, 2026-06-10

## Why this matters

The feed's realtime subscription re-fetches the **entire** first page of posts AND
re-attaches reactions for all of them on **any** change to the `posts` table or the
`reactions` table — with no row filter. That means every time *any* user anywhere
reacts to *any* post, every connected client refetches its whole feed (one posts
query + one reactions query covering N posts) and re-renders the list. On a shared
internal feed this multiplies: M active users × every reaction = M full feed
refetches per reaction. For users on slow devices (the 65–85 cohort), this is
visible jank and wasted bandwidth. Adding a small debounce collapses bursts into a
single refetch and removes the storm without changing the data model.

## Current state

`src/services/postRepository.ts:74-125` — `subscribeToFeed`:

```ts
subscribeToFeed: (onUpdate, onError, limitCount = 10) => {
  const fetchFeed = async () => {
    // SELECT posts (limit) + reactionRepository.attachToPosts(posts)  ← 2 queries, all N posts
    ...
    onUpdate(posts);
  };
  fetchFeed();
  const channel = supabase
    .channel('posts-feed')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => { fetchFeed(); })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => { fetchFeed(); })
    .subscribe(...);
  return () => { supabase.removeChannel(channel); };
}
```

Every event calls the un-throttled `fetchFeed()`. `attachToPosts`
(`src/services/reactionRepository.ts:5-29`) issues a batched reactions query for all
post IDs — so each refetch is 2 round-trips regardless of which single row changed.

`src/hooks/useFeed.ts:27-60` consumes this: it ALSO does its own `fetchInitial()`
(an independent `fetchMorePosts` call) and then registers `subscribeToFeed`, whose
immediate `fetchFeed()` overwrites `recentPosts` again. So on mount the first page
is fetched twice (once by `fetchInitial`, once by the subscription's eager fetch).

Two distinct, compounding costs:
1. **Burst storm** — no debounce: a flurry of reaction/post events each triggers a
   full refetch.
2. **Double initial fetch** — `useFeed.fetchInitial()` and `subscribeToFeed`'s eager
   `fetchFeed()` both populate `recentPosts` on mount.

This plan fixes #1 (the dominant cost) with a debounce, and #2 by removing the
redundant eager fetch path. It does NOT attempt per-row incremental updates (that's
a larger redesign — see Maintenance notes).

Conventions: services are plain objects in `src/services/` wrapping Supabase; the
realtime cleanup contract is `return () => supabase.removeChannel(channel)`. Keep it.

## Commands you will need

| Purpose   | Command                                   | Expected on success |
|-----------|-------------------------------------------|---------------------|
| Typecheck | `npm run lint`                            | exit 0, no errors   |
| Tests     | `npm test`                                | all pass            |
| Feed test | `npx vitest run src/hooks/useFeed.test.ts`| pass                |

## Scope

**In scope** (modify):
- `src/services/postRepository.ts` — debounce `fetchFeed` invocations from the channel.
- `src/hooks/useFeed.ts` — remove the redundant eager initial fetch (pick one source
  of the first page; see Step 2).
- `src/services/postRepository.test.ts` and/or `src/hooks/useFeed.test.ts` — adjust/add tests.
- `plans/README.md` (status row only)

**Out of scope** (do NOT touch):
- `reactionRepository.ts` batching logic — it is already batched; leave it.
- The pagination cursor logic in `fetchMorePosts` — unrelated.
- `subscribeToPost` / `subscribeToComments` (the post-detail subscriptions) — same
  pattern but lower volume; not part of this plan.
- Converting to per-row incremental updates — explicitly deferred.

## Git workflow

- Branch: `advisor/004-feed-refetch-debounce`
- Commit message style: conventional commits (e.g.
  `perf(feed): debounce realtime refetch and drop redundant initial fetch`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Debounce the channel-triggered refetch in `subscribeToFeed`

In `src/services/postRepository.ts`, wrap the channel-triggered `fetchFeed` calls in
a trailing debounce (~250ms) so a burst of events causes a single refetch. Keep the
**eager** `fetchFeed()` on subscribe only if Step 2 keeps it (it will be removed —
see Step 2); the debounce applies to the `.on(...)` handlers.

Target shape:

```ts
subscribeToFeed: (onUpdate, onError, limitCount = 10) => {
  const fetchFeed = async () => { /* unchanged */ };

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const scheduleFetch = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { debounceTimer = null; fetchFeed(); }, 250);
  };

  const channel = supabase
    .channel('posts-feed')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, scheduleFetch)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, scheduleFetch)
    .subscribe((status, err) => { /* unchanged error handling */ });

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    supabase.removeChannel(channel);
  };
}
```

Note the cleanup now also clears the pending timer so a debounced fetch cannot fire
`onUpdate` after unmount.

**Verify**: `npm run lint` → exit 0.

### Step 2: Remove the redundant initial fetch (one source of the first page)

Decide which path owns the initial first-page load and keep exactly one.
Recommended: keep `subscribeToFeed`'s behavior as the live source, and make it
deliver the first page once on subscribe. Then in `src/hooks/useFeed.ts` remove the
separate `fetchInitial()` (lines 30-43) — but `fetchInitial` is also what seeds the
pagination cursor refs (`lastCreatedAtRef`, `lastIdRef`, lines 35-36) used by
`loadMore`. So:

- Keep `subscribeToFeed` delivering the first page via `onUpdate`.
- In the subscription's `onUpdate` callback in `useFeed`, when posts arrive AND the
  cursor refs are still null, seed them from the last post in the delivered list
  (mirror what `fetchInitial` did): `lastCreatedAtRef.current = posts.at(-1)?.createdAt ?? null; lastIdRef.current = posts.at(-1)?.id ?? null;` and set `hasMore` from `posts.length >= PAGE_SIZE`.
- Remove the `fetchInitial` function and its call.

This removes the duplicate first-page query while preserving `loadMore`'s cursor.

> If wiring the cursor seed into the subscription callback proves error-prone, the
> acceptable fallback is to KEEP `fetchInitial` and instead make `subscribeToFeed`
> skip its eager `fetchFeed()` (subscribe to changes only, no immediate fetch),
> leaving `fetchInitial` as the sole first-page source. Either way: the first page
> must be fetched exactly once on mount. Pick one; do not leave both.

**Verify**: reason through `src/hooks/useFeed.test.ts` expectations and run
`npx vitest run src/hooks/useFeed.test.ts` → pass (update the test if it asserted the
old double-fetch; it should assert the first page loads once and `loadMore` still works).

### Step 3: Full typecheck + tests

**Verify**:
- `npm run lint` → exit 0
- `npm test` → all pass

## Test plan

- In `src/hooks/useFeed.test.ts` (existing — model new cases on it): assert that on
  mount the first page is populated and the pagination cursor is set such that a
  subsequent `loadMore` call requests the next page (mock `postService.fetchMorePosts`
  / `subscribeToFeed` and assert call counts: the first page is fetched once, not twice).
- If `postRepository` has a unit test, add a case that simulating two rapid channel
  events results in a single `fetchFeed` round-trip after the debounce window
  (use Vitest fake timers: `vi.useFakeTimers()` + `vi.advanceTimersByTime(250)`).
  Model timer usage on any existing test that uses fake timers; if none, keep this
  test in the hook layer where mocking is established.

Verification: `npm test` → all pass, including the new assertions.

## Done criteria

ALL must hold:

- [ ] `subscribeToFeed` debounces channel-triggered refetches (a `setTimeout`-based
      `scheduleFetch` replaces direct `fetchFeed()` in the two `.on(...)` handlers),
      and the cleanup clears the pending timer.
- [ ] The feed's first page is fetched exactly once on mount (no
      `fetchInitial` + eager `fetchFeed` duplication) — verifiable via the
      updated `useFeed` test's mock call counts.
- [ ] `npm run lint` exits 0.
- [ ] `npm test` exits 0.
- [ ] `git status` shows no modified files outside the in-scope list.
- [ ] `plans/README.md` status row for 004 updated.

## STOP conditions

Stop and report back (do not improvise) if:

- Removing `fetchInitial` breaks `loadMore`'s cursor and the fallback in Step 2 also
  fails to seed it correctly after a reasonable attempt.
- The live `subscribeToFeed`/`useFeed` differ materially from the excerpts (drift).
- A test fails twice after a reasonable fix attempt.

## Maintenance notes

- The real long-term fix is **incremental updates**: apply the changed row from the
  realtime payload to local state instead of refetching the whole page. That is a
  larger change (the channel currently ignores `payload.new`/`payload.old`) and is
  deliberately out of scope here. Note it in the PR as the recommended next step.
- If pagination size (`PAGE_SIZE`) or the feed's sort changes, re-check the cursor
  seeding added in Step 2.
- Reviewer should confirm no `onUpdate` can fire after unmount (debounce timer
  cleared in cleanup) and that the debounce window (250ms) feels responsive for a
  single user posting.
