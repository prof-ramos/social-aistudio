# Plan 005: Add characterization tests for the three untested core services (auth, chat, notifications)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 218b90f..HEAD -- src/services`
> If any service changed since this plan was written, re-read the current
> source of the file you are testing before writing assertions; the tests must
> describe ACTUAL current behavior.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `218b90f`, 2026-06-10

## Why this matters

Eight services have zero test coverage. The three most critical for this app —
`authService` (login/session/profile), `chatService` (private messaging),
`notificationService` (the notification feed + unread counts) — are also on the
data-mutation / auth critical path, exactly where a silent regression is most
costly for a members-only network used by a non-technical audience. These tests are
**characterization tests**: they pin the services' current observable behavior
(which Supabase calls they make, how they map rows, how they handle errors) so that
later refactors (e.g. plan 004's realtime changes, or any query change) fail loudly
instead of breaking production silently. This plan adds no behavior; it only locks
in what exists.

## Current state

No `*.test.ts` exists for `authService.ts`, `chatService.ts`, or
`notificationService.ts` (confirm: `ls src/services/*.test.ts`). The repo already
has a clean, established pattern for mocking Supabase in service tests.

Exemplar to copy — `src/services/postoService.test.ts` (read it fully first):

```ts
import { vi } from 'vitest';
import { postoService } from './postoService';

const rpcMock = vi.fn();
vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
    from: vi.fn(() => ({ select: vi.fn().mockReturnValue({ /* chained */ }) })),
  },
}));

describe('postoService.getHighlightedPosto', () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it('returns posto with highest review count from RPC', async () => {
    rpcMock.mockResolvedValue({ data: [/*...*/], error: null });
    const result = await postoService.getHighlightedPosto();
    expect(rpcMock).toHaveBeenCalledWith('get_highlighted_posto');
    expect(result).toEqual(/* mapped shape */);
  });
});
```

Key facts about the targets (read each file before testing — these are orientation,
not a substitute):

- `authService.ts` — `signIn` calls `supabase.auth.signInWithPassword`, throws on
  error, returns `data`. `sendPasswordReset` calls `resetPasswordForEmail`.
  `onAuthStateChanged` registers `supabase.auth.onAuthStateChange`; on a session it
  fetches the profile from `users` and **signs out + emits null if the profile is
  missing or errors** (`src/services/authService.ts:36-46`). It maps `profileData`
  into a `UserProfile`. There will also be `signOut`. Read the whole file for the
  exact surface.
- `chatService.ts` — wraps Supabase for messaging: a `getOrCreateChat` (calls the
  `get_or_create_chat` RPC), `sendMessage` (inserts into `chat_messages`, then
  updates `chat_sessions`), a `.limit(50)` message fetch, and realtime subscription
  helpers returning an unsubscribe function. Read for exact method names/shapes.
- `notificationService.ts` — fetches notifications (`.limit(50)`), computes unread
  counts, marks read, and exposes a realtime subscription. Read for exact surface.

Test infra (already configured): Vitest `globals: true`, `jsdom`, setup in
`vitest.setup.ts`. Mock module path is `'../lib/supabase'` from within `src/services/`.

Documented testing gotchas in this repo that you MUST respect:
- `vi.mock` factories are hoisted and cannot reference outer module variables — define
  mock fns with `vi.fn()` inside the factory or via `vi.hoisted`. (Mirror exactly how
  `postoService.test.ts` / `postService.test.ts` do it.)
- For any module-level cache, reset it between tests. The Supabase mock is
  re-cleared via `vi.clearAllMocks()` in `beforeEach`.

## Commands you will need

| Purpose          | Command                                          | Expected on success |
|------------------|--------------------------------------------------|---------------------|
| Typecheck        | `npm run lint`                                   | exit 0, no errors   |
| All tests        | `npm test`                                       | all pass            |
| Single new file  | `npx vitest run src/services/authService.test.ts`| pass                |
| Read a target    | `cat src/services/chatService.ts`                | inspect surface     |

## Scope

**In scope** (create):
- `src/services/authService.test.ts`
- `src/services/chatService.test.ts`
- `src/services/notificationService.test.ts`
- `plans/README.md` (status row only)

**Out of scope** (do NOT touch):
- The service source files — this is characterization testing. If a test reveals
  what looks like a bug, **do not fix it here**: write the test to pass against
  current behavior and note the suspected bug in the PR + STOP-condition reporting.
- The other untested services (`adminService`, `userService`, `memberRequestService`,
  `reportService`, `systemService`) — deferred to a follow-up; keep this plan focused.
- Vitest/global config — the existing setup already covers `src/services/`.

## Git workflow

- Branch: `advisor/005-core-service-tests`
- Commit message style: conventional commits (e.g.
  `test(services): characterization tests for auth, chat, notifications`).
  One commit per service file is fine.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: `authService.test.ts`

Read `src/services/authService.ts` fully. Mock `../lib/supabase` exposing an `auth`
object (`signInWithPassword`, `resetPasswordForEmail`, `onAuthStateChange`,
`signOut`) and `from`. Cover:
- `signIn` resolves and returns `data` on success; **throws** when Supabase returns
  an `error`.
- `sendPasswordReset` calls `resetPasswordForEmail` with the email.
- `onAuthStateChanged`: when the auth callback fires with **no session**, the
  consumer callback is invoked with `(null, null)`.
- `onAuthStateChanged`: when a session exists but the `users` profile fetch returns
  an error/empty, the service calls `auth.signOut()` and invokes the consumer with
  `(null, null)` — this is the documented auto-sign-out behavior; pin it.
- `onAuthStateChanged`: a session + a present profile invokes the consumer with a
  mapped `UserProfile` whose `id`/`name`/`email`/`role` match the row.

To drive `onAuthStateChange`, capture the callback passed to the mock and call it
manually inside the test (`let authCb; mock.onAuthStateChange = (cb) => { authCb = cb; return { data: { subscription: { unsubscribe: vi.fn() } } }; }`).

**Verify**: `npx vitest run src/services/authService.test.ts` → pass.

### Step 2: `chatService.test.ts`

Read `src/services/chatService.ts` fully. Cover the highest-value, deterministic paths:
- `getOrCreateChat` calls `supabase.rpc('get_or_create_chat', ...)` with the two
  user IDs (match the actual arg names) and returns the chat id; throws on error.
- `sendMessage` inserts into `chat_messages` with the expected payload
  (`chat_id`, `sender_id`/author field, body) and throws on insert error. If it then
  updates `chat_sessions`, assert that update is attempted on success.
- The message fetch applies `.limit(50)` and maps rows to the `ChatMessage` shape.

Mock the chained Supabase builder the same way `postoService.test.ts` does (each
chained method returns an object exposing the next). Assert on the mock calls.

**Verify**: `npx vitest run src/services/chatService.test.ts` → pass.

### Step 3: `notificationService.test.ts`

Read `src/services/notificationService.ts` fully. Cover:
- the fetch applies `.limit(50)` and maps rows to the notification shape;
- the unread-count computation returns the number of unread items for a given data set;
- mark-as-read issues the expected `update` against the right id(s);
- the error path (Supabase returns `error`) is handled the way the code currently
  does it (throw, or return `[]`/`0` — pin whatever is actual).

**Verify**: `npx vitest run src/services/notificationService.test.ts` → pass.

### Step 4: Full suite

**Verify**:
- `npm run lint` → exit 0
- `npm test` → all pass; total test count increased by the number of new tests.

## Test plan

This plan IS the test plan. Aim for ~4–6 assertions per service covering: happy
path, error/throw path, the row→domain mapping, and (auth) the auto-sign-out
branch. Model every file structurally on `src/services/postoService.test.ts` and
`src/services/postService.test.ts`. Do not introduce real network/timers; everything
is mocked.

Verification: `npm test` → all pass, with `authService.test.ts`,
`chatService.test.ts`, `notificationService.test.ts` present and green.

## Done criteria

ALL must hold:

- [ ] `src/services/authService.test.ts`, `chatService.test.ts`, and
      `notificationService.test.ts` exist.
- [ ] Each covers at least: a happy path, an error/throw path, and a mapping or
      branch assertion (auth additionally covers the missing-profile sign-out branch).
- [ ] `npm run lint` exits 0.
- [ ] `npm test` exits 0; test count increased.
- [ ] No service SOURCE file was modified (`git status` shows only new `*.test.ts`
      files + `plans/README.md`).
- [ ] `plans/README.md` status row for 005 updated.

## STOP conditions

Stop and report back (do not improvise) if:

- A service's actual surface differs substantially from the orientation above
  (method renamed/removed) — re-read and test what exists; if you cannot determine
  intended behavior, report rather than guess.
- Writing a characterization test forces you to assert clearly buggy behavior (e.g.
  a swallowed error that should throw) — pin current behavior, add a `// TODO:
  suspected bug — see PR notes` comment, and report it; do NOT fix the service here.
- A mocking approach fights the `vi.mock` hoisting rule — copy the exact pattern from
  `postoService.test.ts`; if it still fails twice, report.

## Maintenance notes

- These pin CURRENT behavior, including any current quirks. When a service is
  intentionally changed later, the corresponding test SHOULD fail — update it
  deliberately as part of that change, don't delete it.
- Follow-up deferred out of scope: characterization tests for `adminService`,
  `userService`, `memberRequestService`, `reportService`, `systemService`, and a
  `server.ts` / `api/notify-request.ts` handler test (the latter pairs well with
  plan 003's extracted module).
- Reviewer should check the tests assert on real call arguments/mapped output, not
  merely "a function was called" (the playbook's "tests that assert nothing" trap).
