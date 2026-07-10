# Changelog

All notable changes to the **Alumni Hub** ecosystem will be documented in this file.

---

## [3.0.2] - 2026-07-10 — Final Stabilization & Polish

### Added
- **Get Conversation Endpoint**: Added GET `/api/chat/conversations/{id}` to allow clients to query metadata of specific chats by ID.
- **Database Composite Indexes**: Added high-performance indexes `idx_messages_conversation_created` on messages, `idx_notifications_recipient_created` on notifications, and `idx_comments_post_created` on comments.

### Bug Fixes
- **Conversation Load**: Solved critical bug in `/messages` where direct URL navigation with `conversationId` threw a `400 Bad Request` by replacing the incorrect user lookup with the new `getConversation` retrieval utility.
- **Next.js Hydration Mismatch**: Added `suppressHydrationWarning` to date formats across dashboard, directory, alumni profiles, events, messages, reunions, achievements, and notifications to silent React console warnings on client-side hydration.

### Documentation
- Completely redesigned project documentation inside `docs/` and root `README.md`.
- Created specific documents for backend/frontend architecture, database schema with ER diagrams, authentication workflows, websocket STOMP protocols, production deployments, security verifications, performance policies, directory project mappings, and dev guide.

---

## [3.0.1] - 2026-07-10 — Production Stabilization Sprint

### Performance
- **Backend**: Eliminated N+1 write storm in `AlumniService.searchVisibleAlumniWithFilters()` — replaced per-row `save()` with a single batch JPQL `UPDATE` for `searchAppearances` increment.
- **Recommendations**: Rewrote `getPeopleYouMayKnow()` with corrected scoring weights (batch+dept=5, batch+section=3, city=2, company=2, mutual connections=3×N, skills=1 each). Only users with `score > 0` are now recommended, eliminating random zero-score suggestions.

### Bug Fixes
- **Contact Request Errors**: `ContactRequestService` previously threw `IllegalStateException` for duplicate/pending scenarios, which fell through to the generic `Exception` handler returning 500 `SERVER_ERROR`. Now throws `InTouchException` with codes (`ALREADY_CONNECTED`, `REQUEST_PENDING`, `SELF_REQUEST`, `INVALID_REQUEST`) for all edge cases.
- **`GlobalExceptionHandler`**: Added explicit `IllegalStateException` handler (returns 409 Conflict). Fixed generic 500 message from hard-coded "Unable to send In-Touch request" to "Something went wrong. Please try again."
- **CSS `z-55`**: Fixed invalid Tailwind class `z-55` in `alumni/[id]/page.tsx` to the valid arbitrary-value syntax `z-[55]`. The toast component was silently failing to apply its z-index.

### UX & Loading
- **Skeleton Loaders**: Replaced all plain text loading spinners with rich skeleton loaders on Dashboard (header + composer + 3 post cards), Directory (header + 6 profile card grid), and Alumni Profile (breadcrumb + profile card + skills block).
- **Directory Result Count**: Added "N classmates found" / "Searching..." live indicator below the page title so users understand the scope of results.
- **Admission Batch Label + Tooltip**: Renamed "Batch" field to "Admission Batch" with an ⓘ info tooltip in both `edit/page.tsx` and `profile/setup/page.tsx`.

### Layout / Scrolling
- Fixed scroll containment: `html { height: 100%; }` and `body { height: 100%; overflow: hidden; }` now ensure the sidebar stays fixed and only the content area scrolls.
- All authenticated pages updated from `min-h-screen` to `h-screen` outer container for consistent viewport fill.

### Code Quality
- Created **`/frontend/constants/profileConstants.ts`** as single source of truth for `BATCH_OPTIONS` (auto-generated 2010–2030), `DEPARTMENT_OPTIONS`, `SECTION_MAPPING`, and `ADMISSION_BATCH_TOOLTIP`.
- Removed duplicate constant definitions from `edit/page.tsx`, `profile/setup/page.tsx`, and `directory/page.tsx`.
- Removed debug "Simulate Notifications" panel and dead `triggerReunionTest`/`triggerEventTest` handler functions from `Sidebar.tsx`.
- Added `@Slf4j` logging to `ContactRequestService` for production diagnostics.

---

## [3.0.0] - 2026-07-06


### Added
- **Events Module**: Full event scheduling system for reunions, webinars, and lectures with capacity constraints and RSVP tracking.
- **Mentorship Pairing**: Mentor onboarding workspace and custom scheduling and connection features.
- **Referrals & Careers**: Integrated job openings board with bookmark tracking and candidate referral requests.
- **Accomplishments Flow**: Achievements stream showing promotion, start-up, and graduation highlights.
- **Reunion Galleries**: Dynamic media collections supporting comments on specific graduation events.
- **Interactive Analytics**: Graphical trends reporting profile visits and classmate search statistics.
- **Modal Hook (`useModal`)**: Centralized custom keyboard focus and escape key handler to meet accessibility standards.
- **JPA Performance Indexing**: Database composite and single indexes on search parameters (`email`, `batch`, `department`, `section`).
- **In-Touch Structured Errors**: Custom `InTouchException` with codes (`SELF_REQUEST`, `ALREADY_CONNECTED`, `REQUEST_PENDING`, `USER_NOT_FOUND`, `INVALID_REQUEST`) returned as structured JSON `ErrorResponse` objects.
- **Liquid Glass Toast Component**: High-fidelity Toast system replacing legacy browser `alert()` popups for profile actions.

### Changed
- Refactored all inline modals to use the accessibility hook and conform to the Premium Liquid Glass theme.
- Fixed landing page headers, marketing titles, cards, and logins to cover all departments of Sri Vasavi Engineering College (removing department bottlenecks).
- Standardized error handlers to return unified error DTOs instead of Tomcat stack traces or HTTP 500 error pages.
- Fixed state yanking bug in `useModal` by keeping `onClose` inside a useRef container, resolving focus loss in the "Share a Memory" composer.
- Added `@Size(max = 1000)` verification checks on the backend `PostCreateDto` caption inputs.

---

## [2.2.0] - 2026-06-15

### Added
- **Full Notification Drawer**: Grouped notification logs (Today, Yesterday, Earlier) detailing likes, comments, connections, and system updates.
- **WebSocket STOMP Channel**: Synchronized WebSocket messaging to distribute inbox updates in real time.
- **In-Touch Requests**: Department-isolated private networking flow replaces typical social follow bounds.

---

## [1.0.0] - 2026-05-10

### Added
- **Authentication Gateway**: Google OAuth verified ID token checks through the Firebase Admin SDK.
- **Memories Feed**: Photo and high-definition video publishing up to 30MB hosted via Cloudinary.
- **Community Security Visibility Bounds**: Automated branch visibility logic limiting profiles directory access.
- **SSL-Encrypted Redis Cache**: Spring Cache configurations using Upstash Redis SSL.
