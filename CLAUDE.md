# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Social-ASOF is an internal social network built with React 19, Firebase (Auth + Firestore), and Express. It was originally exported from Google AI Studio. The app supports role-based access (ADMIN, MEMBRO_ATIVO, MEMBRO_APOSENTADO, PENDENTE), real-time feeds, direct messaging, notifications, and admin moderation.

## Commands

- `npm run dev` — Start development server (Express + Vite middleware) on http://localhost:3000
- `npm run build` — Production build: Vite bundles the SPA to `dist/`, then esbuild bundles `server.ts` to `dist/server.cjs`
- `npm start` — Run the production server from `dist/server.cjs`
- `npm run lint` — Type-check with `tsc --noEmit`
- `npm test` — Run all tests with Vitest
- `npx vitest run <path>` — Run a single test file
- `npx vitest <path>` — Run a single test file in watch mode
- `npm run preview` — Preview the production build with Vite
- `npm run clean` — Remove `dist/` and generated artifacts

## Environment Variables

Create `.env.local` at the repo root for local secrets:

- `GEMINI_API_KEY` — Google AI Studio / Gemini API key
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `ADMIN_EMAIL` — Used by the Express `/api/admin/notify-request` route to send access-request emails

The Vite dev server respects `DISABLE_HMR=true` (set by AI Studio during agent edits) to disable HMR and file watching.

## Architecture

### Server (`server.ts`)

Express app that serves the React SPA. In development it uses Vite's `middlewareMode`; in production it serves static files from `dist/` with a catch-all SPA fallback. It exposes one custom API endpoint:

- `POST /api/admin/notify-request` — Sends an SMTP email via nodemailer when a new user requests access.

### Client

**Routing & Auth** (`src/App.tsx`)

Uses `BrowserRouter` with a shared `Layout` component that renders the `Navbar` and sidebar. Routes are guarded by auth state: unauthenticated users are redirected to `/login`. Admin routes (`/admin/*`) require `profile.role === 'ADMIN'`.

**Auth Flow** (`src/services/authService.ts`)

Firebase Auth with email/password. `authService.onAuthStateChanged` listens for Firebase auth changes, then fetches the corresponding user profile document from Firestore (`users/{uid}`). If the profile document does not exist, the user is automatically signed out.

**Services** (`src/services/*`)

Services are plain objects that encapsulate all Firebase interactions. Key services:
- `authService` — Firebase Auth sign-in, sign-out, password reset, auth-state listener
- `postService` — Firestore CRUD for posts, real-time feed subscription (`onSnapshot`), reactions, comments, and mention notifications
- `chatService` — Firestore real-time messaging and chat sessions
- `notificationService` — Firestore notifications with unread counts
- `userService` — User profile lookups and presence updates
- `adminService` — Admin-only operations (member approvals, moderation)
- `postoService` — Static and dynamic data for "postos do exterior" (embassy posts)

**Hooks** (`src/hooks/*`)

Hooks wrap services and expose component-ready state. They typically subscribe to Firestore snapshots and clean up on unmount. For example, `useFeed` subscribes to `postService.subscribeToFeed` and manages pagination, filters, and the editor modal state.

**Pages** (`src/pages/*`)

Route components. Most receive the authenticated `profile` prop from the Layout. Pages compose hooks and components; they should not talk to services directly.

**Components** (`src/components/*`)

- `layout/Navbar.tsx` — Top navigation with admin links conditionally rendered
- `feed/` — Feed-specific components: `PostCard`, `PostEditor` (TipTap rich text), `ReactionButtons`, `LeftSidebar`, etc.
- `ui/Skeleton.tsx` — Loading skeletons
- `Tour.tsx` — Onboarding tour using `react-joyride`
- `ErrorBoundary.tsx` — Error boundary

**Types** (`src/types/index.ts`)

Central type definitions:
- `UserRole`: `'ADMIN' | 'MEMBRO_ATIVO' | 'MEMBRO_APOSENTADO' | 'PENDENTE'`
- `Post`, `PostComment`, `ChatMessage`, `ChatSession`, `UserProfile`, `AuthUser`

### Path Alias

`@/` resolves to the repository root (configured in `vite.config.ts` and `tsconfig.json`).

### Firebase

Firebase is initialized in `src/lib/firebase.ts` using credentials from `firebase-applet-config.json` at the repo root. Firestore uses the database ID specified in that config.

### Testing

Tests are co-located with source files (`*.test.ts` / `*.test.tsx`).

- Framework: Vitest with `globals: true`, environment `jsdom`
- Setup file: `vitest.setup.ts` — mocks `ResizeObserver`, `localStorage`, and `matchMedia`, and cleans up the DOM after each test
- `lint-staged` runs `vitest related --run` and `tsc --noEmit` on staged `.ts`/`.tsx` files
