# Plan 003: Consolidate the duplicated notify-request endpoint into one shared, hardened module

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 218b90f..HEAD -- server.ts api/notify-request.ts`
> If either changed since this plan was written, compare the "Current state"
> excerpts against the live code before proceeding; on a mismatch, treat it as
> a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt (with a security hardening rider)
- **Planned at**: commit `218b90f`, 2026-06-10

## Why this matters

The public access-request email endpoint is implemented **twice**, almost line for
line: once as an Express handler in `server.ts` (used in dev / the long-running
server) and once as a Vercel serverless function in `api/notify-request.ts` (used
in production on Vercel). Validation, the in-memory rate limiter, and the
nodemailer setup are duplicated. Two copies drift: a fix or hardening applied to
one is silently missing from the other, and the production path is the serverless
one. Both share two real weaknesses worth fixing while we consolidate: (1) email
validation is just `email.includes('@')`, and (2) the rate limiter is an in-process
`Map`, which on Vercel is per-instance and therefore close to useless against
abuse. Extracting one shared module removes the drift and gives a single place to
strengthen validation.

## Current state

The endpoint is unauthenticated by design (it backs the public "request access"
form) and emails an admin. That public-and-unauthenticated nature is intentional —
do not add auth.

`server.ts:6-23` — in-memory rate limiter (per IP, 5/min):

```ts
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
function checkRateLimit(ip: string): boolean { /* ... */ }
```

`server.ts:32-77` — the Express handler: validates `name`/`email`/`matricula`,
builds a nodemailer transport from `SMTP_*` env vars, sends a fixed-subject text
email. Email check is `!email.includes('@')` (line 46).

`api/notify-request.ts:4-21` — an **identical** rate limiter copy.
`api/notify-request.ts:43-108` — the serverless handler: same validation (line 72:
`!email.includes("@")`), same transport, same email body, plus `readBody`/`json`
helpers and a `405` guard.

Both send a plain-text body (`text:`), not HTML, and the subject is a constant — so
classic SMTP header-injection is not the primary risk; the weak validation mostly
allows malformed/junk submissions and the rate limiter is the only abuse control.

There is no shared `src/lib` (or `api/lib`) module for this today. The repo uses
ESM (`"type": "module"`), TypeScript, and `tsx`/`esbuild` for the server build
(`package.json` `build` bundles `server.ts` with esbuild, `--packages=external`).
Any shared module must be importable from BOTH `server.ts` (bundled by esbuild) and
`api/notify-request.ts` (built by Vercel's Node runtime). A plain `.ts` file with
no path-alias dependency is safest — **do not** rely on the `@/` Vite alias here,
since `api/` is not built by Vite.

## Commands you will need

| Purpose         | Command                                  | Expected on success |
|-----------------|------------------------------------------|---------------------|
| Typecheck       | `npm run lint`                           | exit 0, no errors   |
| Tests           | `npm test`                               | all pass            |
| Build (server)  | `npm run build`                          | exit 0; emits `dist/server.cjs` |
| One test file   | `npx vitest run api/notify-request.test.ts` | new tests pass   |

> NOTE: `npm run build` also runs `vite build`; it should already pass at baseline.
> Run it to confirm the extracted module bundles cleanly into `dist/server.cjs`.

## Scope

**In scope** (create/modify):
- `api/_lib/notifyRequest.ts` (create — shared validation + rate-limit logic; the
  leading underscore keeps Vercel from treating it as a routable function)
- `api/_lib/notifyRequest.test.ts` (create)
- `server.ts` (replace inline validation/rate-limit with imports from the shared module)
- `api/notify-request.ts` (same)
- `plans/README.md` (status row only)

**Out of scope** (do NOT touch):
- The transport/SMTP credentials handling beyond moving it into the shared module —
  do not change env var names or default host.
- Adding CAPTCHA, auth, or a database-backed rate limiter — those are larger product
  decisions; this plan only de-duplicates and tightens input validation. (See
  Maintenance notes.)
- `src/pages/RegisterRequest.tsx` (the form) — no client change required.

## Git workflow

- Branch: `advisor/003-consolidate-notify-request`
- Commit message style: conventional commits (e.g.
  `refactor(api): extract shared notify-request validation + harden email check`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create the shared module

Create `api/_lib/notifyRequest.ts` with: the rate limiter (single copy), a strict
email check, and a pure `validateNotifyRequest(body)` returning either an error
string or the cleaned fields. No framework types — keep it dependency-free so both
callers can use it.

```ts
// Single source of truth for the access-request endpoint's validation + rate limit.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string, now: number = Date.now()): boolean {
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

// Conservative single-line email check: no whitespace/control chars, one @,
// non-empty local + domain with a dot. Rejects the newlines that enable
// header injection if the body is ever moved into a header.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type NotifyFields = { name: string; email: string; matricula: string };

export function validateNotifyRequest(
  body: unknown
): { ok: true; fields: NotifyFields } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const { name, email, matricula } = b;
  if (typeof name !== 'string' || name.trim().length === 0)
    return { ok: false, error: 'Nome é obrigatório.' };
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim()))
    return { ok: false, error: 'E-mail inválido.' };
  if (typeof matricula !== 'string' || matricula.trim().length === 0)
    return { ok: false, error: 'Matrícula é obrigatória.' };
  return { ok: true, fields: { name: name.trim(), email: email.trim(), matricula: matricula.trim() } };
}

// Reset hook for tests (the rate-limit Map is module-level state).
export function _resetRateLimit() { rateLimitStore.clear(); }
```

The `_resetRateLimit` export follows the repo's documented pattern for resetting
module-level caches so tests stay isolated (the same reason `sanitize`/SVG caches
expose resets). Keep it.

**Verify**: `npm run lint` → exit 0.

### Step 2: Rewire `server.ts` to use the shared module

In `server.ts`: delete the local `rateLimitStore`/`RATE_LIMIT_*`/`checkRateLimit`
(lines 6-23) and the inline `name`/`email`/`matricula` validation (lines 42-53).
Import from the shared module and call `checkRateLimit` and `validateNotifyRequest`.
On `!result.ok`, respond `400` with `result.error`; on success use `result.fields`
in the email body. Keep the existing transport and `sendMail` call.

Import path from repo root: `import { checkRateLimit, validateNotifyRequest } from './api/_lib/notifyRequest';`

**Verify**: `npm run build` → exit 0 and `dist/server.cjs` is emitted (confirms the
extracted module bundles into the esbuild output).

### Step 3: Rewire `api/notify-request.ts` to use the shared module

Same change: remove the duplicated limiter (lines 4-21) and inline validation
(lines 69-81). Keep `readBody`, `json`, and the `405` guard. Import:
`import { checkRateLimit, validateNotifyRequest } from './_lib/notifyRequest';`

**Verify**: `npm run lint` → exit 0.

### Step 4: Confirm no duplication remains

**Verify**:
- `grep -rn "rateLimitStore" server.ts api/notify-request.ts` → no matches (both now
  import it).
- `grep -rn "includes('@')\|includes(\"@\")" server.ts api/notify-request.ts` → no
  matches (weak check removed).

## Test plan

New file `api/_lib/notifyRequest.test.ts`, modeled after the `vi`-based unit tests
in `src/services/*.test.ts`. Pure-function tests (no nodemailer needed):

- **valid input** → `validateNotifyRequest` returns `{ ok: true, fields }` with trimmed values.
- **missing name** → `{ ok: false, error: 'Nome é obrigatório.' }`.
- **bad email** (`'notanemail'`, `'a@b'` with no dot, `'a@b.com\nBcc: x@y.com'`) →
  each returns `{ ok: false, error: 'E-mail inválido.' }` (the newline case is the
  header-injection guard).
- **missing matricula** → `{ ok: false, error: 'Matrícula é obrigatória.' }`.
- **rate limit**: call `_resetRateLimit()` in `beforeEach`; the 1st–5th
  `checkRateLimit('ip', fixedNow)` return `true`, the 6th returns `false`; a call
  with `now` past the window resets to `true`. Pass an explicit `now` so the test
  does not depend on wall-clock timing.

Verification: `npx vitest run api/_lib/notifyRequest.test.ts` → all pass; then
`npm test` → all pass.

> Confirm the Vitest config includes `api/` in its test glob. Check
> `vite.config.ts` / `vitest.setup.ts`; if the `include`/`root` excludes `api/`,
> place the test at `src/lib/notifyRequest.test.ts` importing the module by
> relative path instead, and note the deviation. Do NOT broaden the Vitest config
> as part of this plan unless that is the only way to run the test — if you must,
> keep the change minimal and call it out.

## Done criteria

ALL must hold:

- [ ] `api/_lib/notifyRequest.ts` exists and is imported by BOTH `server.ts` and `api/notify-request.ts`.
- [ ] `grep -rn "rateLimitStore" server.ts api/notify-request.ts` → no matches.
- [ ] `grep -rn "includes('@')\|includes(\"@\")" server.ts api/notify-request.ts` → no matches.
- [ ] `npm run lint` exits 0.
- [ ] `npm run build` exits 0 and emits `dist/server.cjs`.
- [ ] `npm test` exits 0 with the new `notifyRequest` tests passing.
- [ ] `git status` shows no modified files outside the in-scope list.
- [ ] `plans/README.md` status row for 003 updated.

## STOP conditions

Stop and report back (do not improvise) if:

- `api/notify-request.ts` cannot import from `api/_lib/notifyRequest.ts` under
  Vercel's build (e.g. the project config restricts `api/` to a single file) — report
  before forcing a workaround.
- `npm run build` fails to bundle the shared import into `dist/server.cjs` — the
  esbuild `--packages=external` setup may need a different module location; report it.
- The live `server.ts`/`api/notify-request.ts` differ materially from the excerpts
  (drift).

## Maintenance notes

- The rate limiter is still in-memory and therefore **not effective on serverless**
  (each Vercel instance has its own `Map`). This plan only de-duplicates it; a real
  fix needs shared state (e.g. Upstash Redis / Vercel KV) or a DB-backed counter.
  Flag this explicitly in the PR so it is a known, tracked limitation rather than a
  silent gap. Recommended follow-up: a separate plan adding a durable rate limiter
  for the production (serverless) path.
- If the email body is ever changed to HTML or the user input is moved into a header
  (subject, from-name), the validation here must be revisited — the current regex
  blocks newlines, which is the key header-injection guard.
- Reviewer should confirm both handlers return the same status codes/messages as
  before for the same inputs (no behavior change beyond stricter email rejection).
