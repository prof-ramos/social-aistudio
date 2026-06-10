# Plan 006: Stop tracking generated/binary artifacts in git (repomix output, screenshots, xlsx)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git ls-files | grep -E "repomix-output.xml|^test-results/|login-page.png|user_personas.xlsx"`
> Compare against the "Current state" list below; if the tracked set differs,
> adjust the file list accordingly (do not blindly run the commands).

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: docs (repo hygiene)
- **Planned at**: commit `218b90f`, 2026-06-10

## Why this matters

Several generated/binary artifacts are committed to the repo and bloat clones and
diffs without adding source value: `repomix-output.xml` (a tool dump of the whole
codebase), eight PNG screenshots under `test-results/` and `login-page.png`, and a
binary `user_personas.xlsx`. Notably, `test-results/` and `*.log` are **already in
`.gitignore`** — these files were committed before the ignore rule existed and stay
tracked until explicitly removed from the index. This is a safe, mechanical cleanup
that untracks them (without deleting the local copies) and extends `.gitignore` so
they don't return.

## Current state

Tracked artifacts (from `git ls-files`):
- `repomix-output.xml` — not in `.gitignore`.
- `login-page.png` — not in `.gitignore`.
- `user_personas.xlsx` — not in `.gitignore`.
- `test-results/design-audit-feed-desktop.png`, `...-feed-mobile.png`,
  `...-login-desktop.png`, `...-login-mobile.png`,
  `test-results/logo-webapp/align-desktop.png`, `...align-mobile-feed.png`,
  `...align-mobile-login.png` — `test-results/` **is** already in `.gitignore:23`,
  so these are tracked-despite-ignored.

`.gitignore` already contains `*.log` (line 6) and `test-results/` (line 23).

> JUDGMENT CALL: `login-page-snapshot.md` (a markdown file) and the various root
> `*.md` docs are NOT in scope — they may be intentional documentation. Only the
> generated dump, screenshots, and the xlsx are targeted. If unsure about a file,
> leave it and note it.

## Commands you will need

| Purpose            | Command                          | Expected on success |
|--------------------|----------------------------------|---------------------|
| List tracked junk  | `git ls-files | grep -E "repomix-output.xml|^test-results/|login-page.png|user_personas.xlsx"` | the list above |
| Typecheck          | `npm run lint`                   | exit 0 (sanity; unaffected) |
| Tests              | `npm test`                       | all pass (unaffected) |

## Scope

**In scope** (modify):
- `.gitignore` — add entries for the not-yet-ignored artifacts.
- Git index — `git rm --cached` the tracked artifacts (keeps the working-tree files).
- `plans/README.md` (status row only)

**Out of scope** (do NOT touch):
- Any root `*.md` documentation file, including `login-page-snapshot.md`.
- Rewriting git history — this plan only stops tracking going forward; it does NOT
  purge the files from past commits (that needs `git filter-repo` and a force-push,
  which is a separate, higher-risk decision — see Maintenance notes).
- Deleting the actual files from disk.

## Git workflow

- Branch: `advisor/006-untrack-artifacts`
- Commit message style: conventional commits (e.g.
  `chore: untrack generated artifacts and screenshots`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Extend `.gitignore`

Append the artifacts not already covered:

```gitignore
# Generated tool output / binaries (not source)
repomix-output.xml
login-page.png
user_personas.xlsx
```

(`test-results/` and `*.log` are already present — do not duplicate them.)

**Verify**: `grep -nE "repomix-output.xml|login-page.png|user_personas.xlsx" .gitignore` → three matches.

### Step 2: Remove the tracked artifacts from the index (keep local files)

```bash
git rm --cached repomix-output.xml login-page.png user_personas.xlsx
git rm -r --cached test-results
```

`--cached` removes them from version control while leaving the files on disk.

**Verify**: `git ls-files | grep -E "repomix-output.xml|^test-results/|login-page.png|user_personas.xlsx"` → **no matches**.

### Step 3: Confirm working tree files still exist and nothing else changed

**Verify**:
- `test -f repomix-output.xml && test -f login-page.png && echo "local files intact"` → prints `local files intact`.
- `git status` → shows deletions staged for the artifacts + modified `.gitignore`, and nothing unexpected.
- `npm run lint` → exit 0 (sanity — should be unaffected).

## Test plan

No code changes, so no new tests. Verification is the `git ls-files` check (Step 2)
plus confirming the build/test baseline is unaffected (`npm test` still passes).

## Done criteria

ALL must hold:

- [ ] `.gitignore` contains `repomix-output.xml`, `login-page.png`, `user_personas.xlsx`.
- [ ] `git ls-files | grep -E "repomix-output.xml|^test-results/|login-page.png|user_personas.xlsx"` → no matches.
- [ ] The files still exist in the working tree (not deleted from disk).
- [ ] `npm test` exits 0 (baseline unaffected).
- [ ] `plans/README.md` status row for 006 updated.

## STOP conditions

Stop and report back (do not improvise) if:

- A file in the target list turns out to be imported/read by code or tests (e.g.
  something actually loads `user_personas.xlsx`) — `grep -rn "user_personas\|login-page.png\|repomix-output" src/ scripts/ supabase/` before removing; if there's a real reference, report it.
- The tracked set differs materially from the "Current state" list (drift).

## Maintenance notes

- This does NOT remove the artifacts from git history; the repo size on a full clone
  is unchanged. If history-size matters, a follow-up using `git filter-repo` +
  coordinated force-push is needed — flag it, don't do it as part of this plan.
- If screenshot-based visual tests are desired, generate them in CI and upload as
  build artifacts rather than committing them.
