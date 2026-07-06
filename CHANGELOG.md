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

### Changed
- Refactored all inline modals to use the accessibility hook and conform to the Premium Liquid Glass theme.
- Fixed landing page headers, marketing titles, cards, and logins to cover all departments of Sri Vasavi Engineering College (removing department bottlenecks).

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
