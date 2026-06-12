---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

**ASOF Specific Rules - Senior Accessibility & Persona Constraints**

The ASOF user base is predominantly **65-85 years old (aposentados)** plus **50-65 years old (ativos)**. Both groups are predominantly public servants with low digital tolerance for complexity.

**Typography & Readability:**
- NEVER use `text-xs` (12px).
- Use `text-sm` (14px) only for non-essential metadata with high contrast.
- Body text must be at least `text-base` (16px), and ideally `text-lg` (18px) for reading areas.
- Always use `leading-relaxed` or `leading-loose` for paragraphs.
- Avoid low opacity text (`opacity-50`, `opacity-60`); ensure high contrast using darker colors or font weights (`font-medium`).

**Navigation & Cognitive Load:**
- NEVER require more than 3 taps/clicks to reach core actions (benefits, dependents, search, profile).
- NEVER use jargon, acronyms, or technical IT terms in UI copy. Use clear, institutional language.
- Avoid "feed" or stream-of-information layouts; prefer categorized, filterable content.
- Do NOT overwhelm with notifications. Make notification settings explicit and easy to disable.

**Trust & Privacy:**
- Always explain WHY data is being requested. The veteran persona deeply distrusts digital scams.
- Show clear privacy indicators (lock icons, "seu dado não será compartilhado") on any data-collection flow.
- Provide visible, easy-to-find "Fale Conosco" or "Ajuda" entry points on every screen.

---
name: code-reviewer
description: Comprehensive code review skill for TypeScript, JavaScript, Python, Swift, Kotlin, Go. Includes automated code analysis, best practice checking, security scanning, and review checklist generation. Use when reviewing pull requests, providing code feedback, identifying issues, or ensuring code quality standards.
---

# Code Reviewer

Complete toolkit for code reviewer with modern tools and best practices.

## Quick Start

### Main Capabilities

This skill provides three core capabilities through automated scripts:

```bash
# Script 1: Pr Analyzer
python scripts/pr_analyzer.py [options]

# Script 2: Code Quality Checker
python scripts/code_quality_checker.py [options]

# Script 3: Review Report Generator
python scripts/review_report_generator.py [options]
```

## Core Capabilities

### 1. Pr Analyzer

Automated tool for pr analyzer tasks.

**Features:**
- Automated scaffolding
- Best practices built-in
- Configurable templates
- Quality checks

**Usage:**
```bash
python scripts/pr_analyzer.py <project-path> [options]
```

### 2. Code Quality Checker

Comprehensive analysis and optimization tool.

**Features:**
- Deep analysis
- Performance metrics
- Recommendations
- Automated fixes

**Usage:**
```bash
python scripts/code_quality_checker.py <target-path> [--verbose]
```

### 3. Review Report Generator

Advanced tooling for specialized tasks.

**Features:**
- Expert-level automation
- Custom configurations
- Integration ready
- Production-grade output

**Usage:**
```bash
python scripts/review_report_generator.py [arguments] [options]
```

## Reference Documentation

### Code Review Checklist

Comprehensive guide available in `references/code_review_checklist.md`:

- Detailed patterns and practices
- Code examples
- Best practices
- Anti-patterns to avoid
- Real-world scenarios

### Coding Standards

Complete workflow documentation in `references/coding_standards.md`:

- Step-by-step processes
- Optimization strategies
- Tool integrations
- Performance tuning
- Troubleshooting guide

### Common Antipatterns

Technical reference guide in `references/common_antipatterns.md`:

- Technology stack details
- Configuration examples
- Integration patterns
- Security considerations
- Scalability guidelines

## Tech Stack

**Languages:** TypeScript, JavaScript, Python, Go, Swift, Kotlin
**Frontend:** React, Next.js, React Native, Flutter
**Backend:** Node.js, Express, GraphQL, REST APIs
**Database:** PostgreSQL, Prisma, NeonDB, Supabase
**DevOps:** Docker, Kubernetes, Terraform, GitHub Actions, CircleCI
**Cloud:** AWS, GCP, Azure

## Development Workflow

### 1. Setup and Configuration

```bash
# Install dependencies
npm install
# or
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

### 2. Run Quality Checks

```bash
# Use the analyzer script
python scripts/code_quality_checker.py .

# Review recommendations
# Apply fixes
```

### 3. Implement Best Practices

Follow the patterns and practices documented in:
- `references/code_review_checklist.md`
- `references/coding_standards.md`
- `references/common_antipatterns.md`

## Best Practices Summary

### Code Quality
- Follow established patterns
- Write comprehensive tests
- Document decisions
- Review regularly

### Performance
- Measure before optimizing
- Use appropriate caching
- Optimize critical paths
- Monitor in production

### Security
- Validate all inputs
- Use parameterized queries
- Implement proper authentication
- Keep dependencies updated

### Maintainability
- Write clear code
- Use consistent naming
- Add helpful comments
- Keep it simple

## Common Commands

```bash
# Development
npm run dev
npm run build
npm run test
npm run lint

# Analysis
python scripts/code_quality_checker.py .
python scripts/review_report_generator.py --analyze

# Deployment
docker build -t app:latest .
docker-compose up -d
kubectl apply -f k8s/
```

## Troubleshooting

### Common Issues

Check the comprehensive troubleshooting section in `references/common_antipatterns.md`.

### Getting Help

- Review reference documentation
- Check script output messages
- Consult tech stack documentation
- Review error logs

## Resources

- Pattern Reference: `references/code_review_checklist.md`
- Workflow Guide: `references/coding_standards.md`
- Technical Guide: `references/common_antipatterns.md`
- Tool Scripts: `scripts/` directory

---
name: supabase-database-guide
description: Guide for interacting with the Supabase PostgreSQL database via CLI and SDK, covering local development and production workflows.
---

# Supabase Database Guide

This project uses **Supabase** (PostgreSQL + Auth + Realtime) as the primary backend.

## Environment Variables

Create `.env.local` at the repo root:

```bash
VITE_SUPABASE_URL=https://xgghwjumuuxlppjspbhj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

> **Security:** `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. Only use it in server-side scripts or one-off CLI tools. Never expose it in client code.

> **Never commit `.env.local`**. It is already in `.gitignore`.

## Authentication (CLI)

To run any `supabase db` command, the CLI must be authenticated:

```bash
supabase login --token <YOUR_ACCESS_TOKEN>
```

Then link to the remote project:

```bash
supabase link --project-ref xgghwjumuuxlppjspbhj
```

## Database Schema & Migrations

### Creating a Migration

```bash
supabase migration new <name>
```

This creates a timestamped SQL file under `supabase/migrations/`.

### Editing a Migration

Open the generated `.sql` file and write raw PostgreSQL. Example:

```sql
CREATE TABLE example (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Pushing to Remote

```bash
supabase db push
```

This applies all pending migrations to the linked Supabase project. You will be prompted for confirmation.

## Local Development

### Option A: Direct Remote (default)

The dev server connects directly to the remote Supabase database:

```bash
npm run dev
```

No local database needed. All reads/writes hit the remote Postgres instance.

### Option B: Local Supabase Stack

If you need an isolated local database (e.g., testing destructive schema changes):

```bash
supabase start
```

This starts a full local Supabase stack (Postgres, Auth, Storage, Realtime, etc.) via Docker.

Update `.env.local` to point to local URLs (printed by `supabase start`).

To stop:

```bash
supabase stop
```

### Resetting Local Data

```bash
supabase db reset
```

Re-runs all migrations on a fresh local database. Useful for consistent local state.

## Production Workflows

### Viewing Database Status

```bash
supabase migration list
```

Shows which migrations have been applied locally vs. remotely.

### Seeding Data (Local Only)

For reproducible test data:

1. Create `supabase/seed.sql`
2. Run:

```bash
supabase db reset
```

The `seed.sql` file is executed after migrations on local resets.

### Running Raw SQL

```bash
supabase db query "SELECT * FROM users LIMIT 5;"
```

For complex or multi-line queries, create a `.sql` file and push it as a migration.

## Type Generation (optional)

Generate TypeScript types from your live database schema:

```bash
npx supabase gen types typescript --project-id xgghwjumuuxlppjspbhj --schema public > src/types/supabase.ts
```

Then import database types from `src/types/supabase.ts` for fully typed queries.

## Troubleshooting

| Issue | Solution |
|---|---|
| `Cannot find project ref` | Run `supabase link --project-ref <ref>` |
| `Access token not provided` | Run `supabase login --token <token>` |
| `infinite recursion detected in policy` | Avoid self-referencing subqueries in RLS; use a `SECURITY DEFINER` helper function |
| `Database error saving new user` | Check trigger `handle_new_user` for missing schema prefixes (e.g., `public.user_role`) |
| `Email not confirmed` | Update `auth.users.email_confirmed_at` via SQL or enable auto-confirm in Auth settings |
| `function pgp_sym_encrypt does not exist (42883)` | Qualify extension functions with schema: `extensions.pgp_sym_encrypt()` not `pgp_sym_encrypt()`. Supabase installs pgcrypto in `extensions` schema. |
| `supabase db query` fails with "connection refused" | `supabase db query` only connects to local database. For remote SQL, use Dashboard SQL Editor or `psql` with the pooler URL from `supabase/.temp/pooler-url` |
| `current_setting('app.key', true)` returns empty | `missing_ok=true` returns `''` not NULL. Always check `<> ''` before using as encryption key or critical parameter |
| `relation "X" does not exist` in SECURITY DEFINER function | `SET search_path = ''` removes ALL schemas including `public`. Qualify every table, function, and type reference: `public.users`, `public.get_crypt_key()`, `public.user_role`, `extensions.pgp_sym_encrypt()`. |

## Extension Schema Qualification

Supabase installs PostgreSQL extensions in the `extensions` schema, not `public`. Always qualify extension function calls:

- `extensions.pgp_sym_encrypt()` / `extensions.pgp_sym_decrypt()` (pgcrypto)
- `extensions.uuid_generate_v4()` (uuid-ossp)
- Never assume extension functions are on the default search path.

## Destructive SQL Rules

- Never include `DROP COLUMN` in the same migration that adds the replacement column. Create a separate follow-up migration and only apply after verifying data integrity in production.
- Encryption keys are embedded in a `SECURITY DEFINER` function (`get_crypt_key()`) with `SET search_path = ''`. Key rotation requires a new migration that replaces the function body. Never expose the key client-side.
- `SET search_path = ''` is required for SECURITY DEFINER functions (prevents search path injection), but it removes ALL schemas from the path — qualify every reference: tables (`public.users`), functions (`public.get_crypt_key()`), extension functions (`extensions.pgp_sym_encrypt()`), and enum types (`public.user_role`).
- `ALTER DATABASE SET "app.asof_crypt_key"` fails on Free/Nano plans (no superuser). Use the `get_crypt_key()` SECURITY DEFINER approach instead.

## Scripts

| Script | Purpose |
|---|---|
| `supabase/test-connection.ts` | Verify remote connectivity and schema presence |
| `supabase/setup-admin.ts` | Create or ensure an admin user exists in `users` + `auth.users` |
| `supabase/seed-data.ts` | Populate the database with test users, posts, comments, etc. Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` |


---

## User Personas Reference

All frontend and UX decisions must align with the two dominant personas derived from a sample of 1,750 member records:

### Persona 1: The Veteran Public Servant (Retired)
- **Age:** 65-85 (born 1935-1955)
- **Location:** Brasília (DF) and Rio de Janeiro (RJ)
- **Digital behavior:** Mobile/tablet only; low tolerance for complex UI; fearful of scams
- **Goals:** Reconnect with former colleagues, track pension/benefits, read official communiqués
- **Pain points:** Small fonts, confusing navigation, lack of privacy cues, excessive notifications

### Persona 2: The Senior Public Servant (Active)
- **Age:** 50-65 (born 1960-1975)
- **Location:** Brasília (DF) and state capitals
- **Digital behavior:** Smartphone power user (WhatsApp, banking apps); time-constrained
- **Goals:** Manage dependents, access health plan data, resolve bureaucracy digitally
- **Pain points:** Too many clicks for simple tasks, noisy/unfiltered information feeds

**Design mandate:** Clarity over decoration. Accessibility over aesthetics. Trust over cleverness.

