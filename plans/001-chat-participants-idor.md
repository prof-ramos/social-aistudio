# Plan 001: Close the chat-participants IDOR so users cannot read other people's private DMs

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 218b90f..HEAD -- supabase/migrations`
> If any migration changed since this plan was written, re-read the current
> `chat_participants` policies before proceeding; on a mismatch with the
> "Current state" excerpts below, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `218b90f`, 2026-06-10

## Why this matters

Direct messages in this app are private one-to-one chats. Read access to a chat's
messages is granted by RLS purely on the basis of having a row in
`chat_participants` for that `chat_id`. The current INSERT policy on
`chat_participants` lets **any authenticated user insert a row for any
`chat_id`** as long as `user_id = auth.uid()`. So a member who learns or guesses
another conversation's `chat_id` can add themselves as a participant and then
read the entire private thread between two other people. This is a broken-access-
control / IDOR bug with a direct privacy impact in a members-only network. The
fix removes the ability to self-insert into arbitrary chats; legitimate chat
creation already happens through a `SECURITY DEFINER` RPC, so normal flows keep
working.

## Current state

Relevant files:
- `supabase/migrations/20260608013515_schema_init.sql` — base schema; defines the
  `chat_messages` SELECT policy that trusts `chat_participants` membership (lines ~235–238).
- `supabase/migrations/20260608030000_fix_critical_issues.sql` — the file that
  introduced the over-permissive INSERT policy and documents that sessions are
  created via the `get_or_create_chat` RPC.
- `supabase/migrations/20260608031000_chat_rpc.sql` — defines `get_or_create_chat`,
  the `SECURITY DEFINER` function that creates a chat session and inserts BOTH
  participants. This is the legitimate path that must keep working.

The vulnerable policy, `supabase/migrations/20260608030000_fix_critical_issues.sql:20-23`:

```sql
-- Users can join chats (chat_participants)
DROP POLICY IF EXISTS "Users join chats" ON chat_participants;
CREATE POLICY "Users join chats" ON chat_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

The read policy that this exposes, `supabase/migrations/20260608013515_schema_init.sql:235-238`:

```sql
CREATE POLICY "Chat participants see messages" ON chat_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM chat_participants WHERE chat_id = chat_messages.chat_id AND user_id = auth.uid()
  ));
```

`get_or_create_chat` (in `20260608031000_chat_rpc.sql`) runs as `SECURITY DEFINER`,
so it inserts participant rows **bypassing RLS** — it does not rely on the "Users
join chats" INSERT policy. Confirm this during Step 1 by reading the function body
(look for `INSERT INTO chat_participants` and a `SECURITY DEFINER` marker).

Repo migration conventions: forward-only, timestamped SQL files named
`YYYYMMDDHHMMSS_description.sql` in `supabase/migrations/`, each using
`DROP POLICY IF EXISTS ...` before `CREATE POLICY ...` so they are re-runnable.
Match that style exactly (see any file in that directory as an exemplar).

## Commands you will need

| Purpose      | Command                                   | Expected on success |
|--------------|-------------------------------------------|---------------------|
| Typecheck    | `npm run lint`                            | exit 0, no errors   |
| Tests        | `npm test`                                | all pass            |
| Inspect RPC  | `grep -n -A40 "get_or_create_chat" supabase/migrations/20260608031000_chat_rpc.sql` | shows function body with `SECURITY DEFINER` and `INSERT INTO chat_participants` |

> NOTE: There is no local Supabase instance wired into CI, and migrations are not
> auto-applied by the test suite. This plan delivers a **new migration file**; you
> are NOT expected to run it against a live database. Verification here is by SQL
> review + confirming the app's TypeScript still builds and tests pass.

## Scope

**In scope** (the only files you should create/modify):
- `supabase/migrations/<new-timestamp>_restrict_chat_participants_insert.sql` (create)
- `plans/README.md` (status row only)

**Out of scope** (do NOT touch):
- `supabase/migrations/20260608030000_fix_critical_issues.sql` and every other
  existing migration — migrations are immutable history; fix forward with a new file.
- `src/services/chatService.ts` and any client code — the client already creates
  chats through the `get_or_create_chat` RPC; no client change is required.
- The `chat_messages` SELECT policy — it is correct; the bug is the INSERT policy.

## Git workflow

- Branch: `advisor/001-chat-participants-idor`
- Commit message style: conventional commits, matching `git log` (e.g.
  `fix(security): restrict chat_participants INSERT to block DM IDOR`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Confirm `get_or_create_chat` is `SECURITY DEFINER` and inserts participants

Run: `grep -n -A40 "get_or_create_chat" supabase/migrations/20260608031000_chat_rpc.sql`

Confirm the function (a) is declared `SECURITY DEFINER`, and (b) performs
`INSERT INTO chat_participants` for both users itself.

**If the function is NOT `SECURITY DEFINER`, or it does NOT insert the participant
rows itself, STOP** — removing the open INSERT policy would break chat creation,
and a different fix is needed.

**Verify**: the grep output shows `SECURITY DEFINER` and an `INSERT INTO chat_participants`.

### Step 2: Create the corrective migration

Create `supabase/migrations/<new-timestamp>_restrict_chat_participants_insert.sql`.
Use a timestamp later than the newest existing migration
(`20260609000500_*`). For example `20260610120000_restrict_chat_participants_insert.sql`.

Contents (drop the permissive policy; do not add a client-facing INSERT policy —
the `SECURITY DEFINER` RPC does not need one):

```sql
-- Security fix: the previous "Users join chats" INSERT policy let any
-- authenticated user insert themselves into ANY chat_id, granting read access
-- to other users' private messages (chat_messages SELECT trusts participant rows).
-- Chats and their participant rows are created exclusively by the
-- get_or_create_chat() SECURITY DEFINER RPC, which bypasses RLS, so no
-- client-facing INSERT policy on chat_participants is required.

DROP POLICY IF EXISTS "Users join chats" ON chat_participants;

-- Intentionally NOT recreating an INSERT policy: with RLS enabled and no
-- permissive INSERT policy, direct client inserts are denied by default, while
-- the SECURITY DEFINER RPC continues to insert participants.
```

**Verify**: `test -f supabase/migrations/*restrict_chat_participants_insert.sql && echo OK` → prints `OK`.

### Step 3: Confirm the app still type-checks and tests pass

The change is SQL-only, so this is a regression guard, not a behavior test.

**Verify**:
- `npm run lint` → exit 0
- `npm test` → all pass

## Test plan

No automated DB test harness exists in this repo, so there is no in-suite test to
add for the RLS policy. The verification is:

1. SQL review: the new migration only drops the over-permissive policy and adds no
   new permissive INSERT policy.
2. Manual verification checklist for whoever applies the migration to staging
   (record in the PR description, do NOT script it here):
   - As user A, open a DM with user B; confirm sending/receiving still works
     (exercises `get_or_create_chat`).
   - As user C, attempt `insert into chat_participants (chat_id, user_id)
     values ('<A-B chat id>', '<C id>')` via the Supabase client — expect an RLS
     denial.
   - As user C, attempt to select `chat_messages` for the A–B `chat_id` — expect
     zero rows.

## Done criteria

ALL must hold:

- [ ] A new migration file `*_restrict_chat_participants_insert.sql` exists under `supabase/migrations/` with a timestamp later than `20260609000500`.
- [ ] The migration drops `"Users join chats"` and creates no new permissive INSERT policy on `chat_participants`.
- [ ] No existing migration file was modified (`git status` shows only the new file + `plans/README.md`).
- [ ] `npm run lint` exits 0.
- [ ] `npm test` exits 0.
- [ ] `plans/README.md` status row for 001 updated.

## STOP conditions

Stop and report back (do not improvise) if:

- `get_or_create_chat` is not `SECURITY DEFINER`, or does not itself insert into
  `chat_participants` (Step 1) — the open INSERT policy may be load-bearing.
- `grep -rn "chat_participants" src/services/chatService.ts` shows the client
  inserting participant rows directly (not via the RPC) — removing the policy
  would break that path; report it instead.
- The "Current state" policy excerpts do not match the live migration files.

## Maintenance notes

- If a future feature needs group chats or self-service "join", reintroduce an
  INSERT policy whose `WITH CHECK` validates the caller is *already* an authorized
  participant or an invitee — never a bare `user_id = auth.uid()`.
- Reviewer should confirm no other table grants read access transitively through a
  self-insertable join table (same pattern). `notifications`, `saved_posts`, and
  `reports` are worth a glance.
- Deferred out of scope: hardening `member_requests`/`reports` policies — tracked
  separately; not part of this fix.
