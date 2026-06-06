# Architecture Overview
This document serves as a critical, living template designed to equip developers with a rapid and comprehensive understanding of the codebase's architecture, enabling efficient navigation and effective contribution from day one.

## 1. Project Structure
This section provides a high-level overview of the project's directory and file structure, categorised by architectural layer or major functional area.

```
/
├── firebase-applet-config.json # Firebase configuration
├── firestore.rules             # Firebase Firestore security rules
├── index.html                  # HTML entry point
├── package.json                # Project dependencies and scripts
├── src/                        # Main source code for frontend application
│   ├── App.tsx                 # Application component and routing
│   ├── main.tsx                # React entry point
│   ├── components/             # Reusable UI components
│   │   ├── feed/               # Feed specific components (PostEditor)
│   │   └── layout/             # Layout components (Navbar)
│   ├── data/                   # Static data or initial seeding (postosData.ts)
│   ├── hooks/                  # Custom React hooks (UI state management & logic)
│   ├── lib/                    # Library configurations
│   │   ├── firebase.ts         # Firebase initialization and exports
│   │   └── utils.ts            # Utility functions (cn for Tailwind classes)
│   ├── pages/                  # Application pages/views
│       ├── AdminMembers.tsx    # Admin panel for members
│       ├── AdminModeration.tsx # Admin panel for report moderation
│       ├── Feed.tsx            # Main social feed
│       ├── ForgotPassword.tsx  # Password recovery flow
│       ├── Login.tsx           # Authentication page
│       ├── Notifications.tsx   # Notification center
│       ├── PostDetails.tsx     # Single post view with comments
│       ├── PostoDetails.tsx    # Details of a specific Posto (location)
│       ├── Postos.tsx          # Directory of Postos
│       ├── Profile.tsx         # User profile page
│       └── RegisterRequest.tsx # Access request form
│   ├── services/               # Firebase operations encapsulating DB/Auth logic
│   └── types/                  # Global TypeScript interfaces and domain models
```

## 2. High-Level System Diagram
The application follows a client-serverless architecture using Firebase as the backend-as-a-service (BaaS). The React frontend communicates directly with Firebase services (Firestore, Auth) using the Firebase Client SDK.

```
[User] <--> [React Frontend (Vite)] <--> [Firebase Authentication]
                                     |
                                     +-> [Cloud Firestore (Database)]
```

## 3. Core Components

### 3.1. Frontend
**Name:** Social-ASOF Web App
**Description:** The main user interface for interacting with the system, allowing users to view feeds, engage in discussions about diplomatic postings (postos), manage their profile, and perform administrative duties based on their roles.
**Architecture:** The frontend relies on a strongly typed layered pattern: `pages/` handle view composition, `hooks/` orchestrate UI state, `services/` encapsulate external Firebase calls and data handling, and `types/` manage domain models.
**Technologies:** React 18, Vite, TypeScript, Tailwind CSS, React Router DOM, Tiptap (Rich Text Editor).
**Deployment:** Served as a single-page application (SPA).

### 3.2. Backend Services
The backend is entirely managed via Firebase.

**Name:** Firebase Backend
**Description:** Handles user authentication, database persistence, and authorization via Firestore Rules.
**Technologies:** Firebase Authentication, Cloud Firestore.

## 4. Data Stores

### 4.1. Primary Database
**Name:** Cloud Firestore
**Type:** NoSQL Document Database
**Purpose:** Stores user profiles, posts, comments, postos fields, notifications, member requests, and moderation reports.
**Key Collections:**
- `users`: User profiles containing names, roles, and bio.
- `posts`: Social feed posts.
    - `comments`: Sub-collection representing comments on a post.
- `postos`: Details about diplomatic postings.
    - `fields`: Sub-collection containing dynamic structured fields (Security, Cost of living, etc.).
    - `comments`: Sub-collection for comments related to a specific posto.
- `memberRequests`: Temporary collection for users requesting access.
- `notifications`: User notifications (mentions, replies).
- `reports`: Content reported by users.
- `moderationLogs`: History of actions taken by administrators.

## 5. External Integrations / APIs

**Service Name:** Firebase Authentication
**Purpose:** Handles user sign-in, password recovery, and session management using email/password authentication.
**Integration Method:** Firebase Client SDK.

## 6. Deployment & Infrastructure

**Cloud Provider:** Google Cloud (Firebase)
**Key Services Used:** Firebase Authentication, Firestore Database, Firebase Hosting (if deployed).
**Routing:** Handled client-side via React Router.

## 7. Security Considerations

**Authentication:** Firebase Auth sessions (JWT-based, handled transparently by the SDK).
**Authorization:** 
- Client-side route protection (e.g., redirecting unauthenticated users to `/login`).
- Admin-only routes protected by role-based checks (verifying `role === 'ADMIN'`).
- (Plan) Firestore Rules ensure that data can only be read/written by authorized and authenticated users, mitigating client-side bypasses.
**Data Encryption:** Inherited from Firebase (TLS in transit, encrypted at rest to Google Cloud standards).

## 8. Development & Testing Environment

**Local Setup Instructions:** 
Run `npm run dev` to start the local Vite development server. It connects to the configured Firebase instance defined in `src/lib/firebase.ts`.
**Code Quality Tools:** TypeScript compiler (`tsc`), Vite linter.

## 9. Future Considerations / Roadmap
- Implement Firebase Cloud Functions for server-side trusted operations (e.g., sending emails to requested members, triggering moderation alerts).
- Secure the Firestore database by writing comprehensive `firestore.rules`.
- Transition the 'Posto' search to utilize a dedicated search service (like Algolia or Typesense) to improve query capabilities if the dataset grows significantly.

## 10. Project Identification

**Project Name:** Social-ASOF
**Date of Last Update:** 2026-06-05

## 11. Glossary / Acronyms

- **ASOF:** Associação dos Oficiais de Chancelaria.
- **Posto:** A diplomatic posting or location.
- **BaaS:** Backend-as-a-Service (referring to Firebase in this context).
