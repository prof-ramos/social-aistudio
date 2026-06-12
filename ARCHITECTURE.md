# Architecture Overview

This document describes the current architecture of the Social-ASOF application. The platform migrated from Firebase to Supabase (PostgreSQL + Auth + Realtime) and uses a custom Express server for sensitive operations like email dispatch.

## 1. Project Structure

```
/
├── index.html                  # HTML entry point
├── package.json                # Project dependencies and scripts
├── server.ts                   # Express server (Vite middleware dev, static prod)
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── src/                        # Main source code for frontend application
│   ├── App.tsx                 # Root component with BrowserRouter and route definitions
│   ├── main.tsx                # React entry point
│   ├── index.css               # Global styles (Tailwind CSS v4)
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # Primitive components (Button, Card, Toast, etc.)
│   │   ├── feed/               # Feed-specific components (PostCard, PostEditor)
│   │   ├── layout/             # Layout components (Navbar, PageContainer)
│   │   └── brand/              # Brand identity components (AsofLogo, AuthShell)
│   ├── pages/                  # Application pages/views
│   ├── hooks/                  # Custom React hooks (state management, Realtime subscriptions)
│   ├── services/               # Data access layer encapsulating Supabase SDK calls
│   ├── contexts/               # React context providers (AuthContext)
│   ├── lib/                    # Library configurations
│   │   ├── supabase.ts         # Supabase client initialization
│   │   └── utils.ts            # Utility functions (cn for Tailwind classes)
│   ├── types/                  # Global TypeScript interfaces and domain models
│   ├── data/                   # Static data (postosData.ts)
│   ├── layout/                 # Layout wrapper (AppLayout)
│   ├── routes/                 # Route configuration (RouteConfig.tsx)
│   └── policies/               # Business rule validators (postPolicy.ts)
├── supabase/                   # Database management
│   ├── migrations/             # PostgreSQL migrations (timestamped SQL)
│   ├── seed-data.ts            # Test data seeding script
│   ├── setup-admin.ts          # Admin user setup script
│   └── test-connection.ts      # Connectivity test script
└── docs/                       # Documentation
```

## 2. High-Level System Diagram

The application follows a hybrid architecture. The React SPA communicates directly with Supabase (PostgreSQL + Auth + Realtime + Storage) via the Supabase JS SDK. A lightweight Express server handles operations that require server-side secrets (SMTP email dispatch).

```
[User] <--> [React SPA (Vite)] <--> [Supabase Auth]
                                |
                                +--> [Supabase PostgreSQL (RLS)]
                                |
                                +--> [Supabase Realtime (live feeds, chat, notifications)]
                                |
                                +--> [Supabase Storage (avatars)]
                                |
                                +--> [Express API (/api/admin/notify-request)]
                                            |
                                            +--> [SMTP (Nodemailer)]
```

### Data Flow

```
[Component] --> [Hook] --> [Service] --> [Supabase SDK] --> [PostgreSQL]
                                                 |
                                                 +--> [Realtime Channel] --> [Hook] --> [Component (live update)]
```

## 3. Core Components

### 3.1. Frontend
**Name:** Social-ASOF Web App
**Description:** The main user interface for interacting with the system, allowing users to view feeds, engage in discussions about diplomatic postings (postos), manage their profile, send direct messages, and perform administrative duties based on their roles.
**Architecture:** The frontend relies on a strongly typed layered pattern: `pages/` handle view composition, `hooks/` orchestrate UI state and Realtime subscriptions, `services/` encapsulate Supabase SDK calls, and `types/` manage domain models.
**Technologies:** React 19, Vite 6, TypeScript 5.8, Tailwind CSS v4, React Router DOM v7, TipTap (Rich Text Editor), Motion (animations).
**Deployment:** Built as a single-page application (SPA), served by Express or deployed on Vercel.

### 3.2. Backend Services
The backend consists of two layers:

**Supabase (BaaS):**
- **PostgreSQL** — Relational database with Row Level Security (RLS)
- **Auth** — Email/password authentication, session management
- **Realtime** — WebSocket-based live updates for feed, chat, and notifications
- **Storage** — Avatar and file uploads

**Express Server (`server.ts`):**
- **Vite middleware** (dev) or static file serving (prod)
- **POST /api/admin/notify-request** — SMTP email dispatch for access requests

## 4. Data Stores

### 4.1. Primary Database
**Name:** Supabase PostgreSQL
**Type:** Relational Database (SQL)
**Purpose:** Stores all application data — users, posts, comments, diplomatic posts (postos), chat messages, notifications, member requests, and moderation reports.
**Access Control:** Row Level Security (RLS) policies on all user-facing tables.

### Key Tables

| Table | Service | Purpose |
|-------|---------|---------|
| `users` | `authService`, `userService` | User profiles (role, avatar, bio, contact) |
| `posts` | `postService` | Social feed posts with rich text content |
| `post_comments` | `postService` | Comments on posts |
| `postos` | `postoService` | Diplomatic post directory |
| `posto_reviews` | `postoService` | User reviews and ratings for postos |
| `chat_sessions` | `chatService` | Direct message session metadata |
| `chat_messages` | `chatService` | Individual chat messages |
| `notifications` | `notificationService` | User notifications (mentions, replies) |
| `member_requests` | `memberRequestService` | Access requests from new members |
| `reports` | `reportService` | Content reported by users |

### 4.2. Storage
**Name:** Supabase Storage
**Purpose:** Avatar image uploads and file attachments.
**Buckets:** `avatars` — profile pictures; `logos` — institutional brand assets.

## 5. External Integrations / APIs

| Service | Purpose | Integration Method |
|---------|---------|-------------------|
| Supabase Auth | Email/password login, password reset, session management | Supabase JS SDK (`@supabase/supabase-js`) |
| Supabase PostgreSQL | Relational data store with RLS | Supabase JS SDK |
| Supabase Realtime | Live feed, chat, and notification updates | Supabase JS SDK (channel subscription) |
| Supabase Storage | Avatar and file uploads | Supabase JS SDK |
| SMTP (Nodemailer) | Email dispatch for access request notifications | Express route (`POST /api/admin/notify-request`) |

## 6. Deployment & Infrastructure

**Current Platform:** Vercel
**Key Services:**
- **Vercel Functions** — Express server deployed as a serverless function
- **Supabase Cloud** — PostgreSQL + Auth + Realtime + Storage
- **SMTP Provider** — Transactional email dispatch

**Routing:**
- Client-side: React Router DOM v7
- Server-side: Express catch-all SPA fallback (`server.ts`)
- Vercel: `vercel.json` rewrites for SPA + function routing

## 7. Security Considerations

**Authentication:** Supabase Auth sessions (JWT-based, handled transparently by the SDK).
**Authorization:**
- Client-side route protection (redirecting unauthenticated users to `/login`)
- Admin-only routes protected by role-based checks (`profile.role === 'ADMIN'`)
- Row Level Security (RLS) policies on PostgreSQL tables enforce data access at database level
- `SUPABASE_SERVICE_ROLE_KEY` is never exposed in client code

**Data Encryption:** TLS in transit, encrypted at rest (Supabase / Cloud provider standards).

## 8. Development & Testing Environment

**Local Setup:** Run `npm run dev` to start the Express + Vite dev server on port 3000. It connects to the remote Supabase instance configured in `.env.local`.
**Testing:** Vitest + Testing Library (jsdom), co-located `*.test.ts`/`*.test.tsx` files.
**Code Quality:** TypeScript compiler (`tsc --noEmit`), Husky pre-commit hooks (lint-staged).

## 9. Future Considerations / Roadmap

- Add ESLint configuration for consistent code style
- Enable TypeScript strict mode (`strict`, `noImplicitAny`, `strictNullChecks`)
- Implement CI/CD test runner in GitHub Actions
- Generate `src/types/supabase.ts` from live database schema
- Create ADRs (Architecture Decision Records) for key migrations
- Migrate UI components to shadcn/ui (Sprints 0-6 documented in `docs/SHADCN-MIGRATION.md`)
- Add Docker containerization for reproducible deployments

## 10. Project Identification

**Project Name:** Social-ASOF
**Last Architecture Update:** 2026-06-12
**Maintainer:** ASOF — Associação dos Oficiais de Chancelaria

## 11. Glossary / Acronyms

- **ASOF:** Associação dos Oficiais de Chancelaria.
- **Posto:** A diplomatic posting or location (embassy, consulate).
- **RLS:** Row Level Security — PostgreSQL policy-based access control.
- **BaaS:** Backend-as-a-Service (referring to Supabase in this context).
