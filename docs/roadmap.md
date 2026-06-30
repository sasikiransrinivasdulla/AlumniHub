# Development Roadmap

This roadmap outlines the milestones and features planned for the development of the **Alumni Hub** community platform.

---

## 📍 Current Phase: Foundation & Verification
- [x] Scaffolding frontend Next.js 16 structure with clean directory layout
- [x] Scaffolding backend Spring Boot 3 structure with Maven wrappers
- [x] Implementing Google Authentication using Firebase Web SDK + Firebase Admin verification
- [x] Implementing PostgreSQL DB integration with JPA/Hibernate schema syncing
- [x] Custom JWT generation for secure sessions
- [x] Modern B&W layout styles for login page and landing dashboard
- [x] Mockito integration testing to verify OAuth backend workflows

---

## 📍 Next Phase: Profile Onboarding & Classmate Directory
- [ ] **Onboarding Form**: Frontend client flow to configure user graduation profile:
  - Graduation Batch (e.g. 2020)
  - College Department (e.g. Computer Science)
  - Section (e.g. Section-A)
  - Profile attributes (Bio, Current Position, Phone Number)
- [ ] **Data Model Extensions**: Mappings for Batches, Departments, and Sections.
- [ ] **Classmate Directory Search**: Find classmates by name or graduation class.
- [ ] **Strict Visibility Gate**: Restrict viewing detailed contact information (phone number, email) to alumni matching the *exact same* graduation batch, department, and section.

---

## 📍 Third Phase: Social Community Features
- [ ] **Media Feed & Posts**: Users can submit posts, thoughts, and links to the community timeline.
- [ ] **Cloudinary Integration**: High-performance upload and hosting for posts and avatars.
- [ ] **Interactions**: Upvote/like posts and comment on updates.
- [ ] **Notifications**: Real-time notifications for interactions on posts.
