# Changelog

All notable changes to the **Alumni Hub** ecosystem will be documented in this file.

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
