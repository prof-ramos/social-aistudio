<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-06-10 | Updated: 2026-06-10 -->

# pages

## Purpose
Route-level page components that compose hooks and UI components into full-page views. Each page corresponds to a route in the application. Pages receive the authenticated `profile` as a prop and orchestrate data flow without calling services directly.

## Key Files

| File | Description |
|------|-------------|
| `Feed.tsx` | Main social feed timeline with category filters and infinite pagination |
| `Login.tsx` | Authentication page with email/password form |
| `PostDetails.tsx` | Single post view with real-time comments |
| `Profile.tsx` | User profile display with bio, avatar, saved posts |
| `Messages.tsx` | Direct messaging interface with conversation list and chat pane |
| `Notifications.tsx` | Notification center with read/unread management |
| `Postos.tsx` | Directory of diplomatic posts with search |
| `PostoDetails.tsx` | Individual posto details with reviews and ratings |
| `AdminHub.tsx` | Admin dashboard with member and moderation management |
| `AdminMembers.tsx` | Member access request approval/rejection panel |
| `AdminModeration.tsx` | Content moderation and report triage |
| `ForgotPassword.tsx` | Password recovery form |
| `RegisterRequest.tsx` | New member access request form |
| `CarreiraPromocao.tsx` | Career and promotion information page |
| `Aposentadoria.tsx` | Retirement guide and information page |
| `Feed.test.tsx` | Tests for Feed page |
| `Login.test.tsx` | Tests for Login page |
| `PostDetails.test.tsx` | Tests for PostDetails page |
| `Profile.test.tsx` | Tests for Profile page |

## For AI Agents

### Working In This Directory
- Pages are imported by `src/App.tsx` via route configuration
- Pages receive `profile` prop from Layout — never access AuthContext directly
- Compose hooks for data logic; do not call services directly in page components
- Keep page components focused on composition, not business logic

### Testing Requirements
- Test route rendering, data display, and user interactions
- Mock service hooks for deterministic test behavior

<!-- MANUAL: -->
