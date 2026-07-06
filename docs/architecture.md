# Architectural Blueprint

Alumni Hub is built using a decoupled Client-Server architecture. This document outlines the layer roles and the security verification flow.

---

## 🏛️ System Component Layout

### 1. Frontend Architecture (Next.js 16)
The client follows a clean layout exploiting Next.js App Router:
* **`app/`**: Implements routing.
  - `page.tsx` (Login): Collects credentials and initializes Firebase popups.
  - `dashboard/` (Profile page): Displays authenticated user profile data fetched dynamically.
  - `dashboard/edit/` (Edit page): Provides validated inputs and dropdowns to update details.
  - `profile/setup/` (Setup page): Mandatory onboarding form displaying read-only details alongside Batch, Department, and dynamic Section dropdown selectors.
* **`components/`**: Reusable component structures (Sidebar, CursorTrail, PageTransition).
* **`lib/`**: External sdk configs.
  - `firebase.ts` parses client parameters and exports Auth provider models.
* **`services/`**: Communication and token storage clients.
  - `authService.ts` wraps HTTP requests to the backend (login, getProfile, updateProfile) and handles token caching.
  - `postService.ts` provides wrappers for post creation and memories feed retrieval.
  - `likeCommentService.ts` coordinates toggling likes and posting/deleting comments.
  - `alumniService.ts` provides classmates listing, search lookups, and connection logic.
  - `eventService.ts` coordinates event creation, RSVP toggles, and retrieval.
  - `mentorshipService.ts` handles mentorship pairing requests, approvals, and logs.
  - `jobService.ts` provides wrappers for job post creation and bookmarks.
  - `referralService.ts` manages referral requests and job postings.
  - `achievementService.ts` publishes and reads achievement records.
  - `reunionService.ts` coordinates album galleries, photos/videos, and timelines.
  - `analyticsService.ts` retrieves connections growth, profile views, and monthly activities.

### 2. Backend Architecture (Spring Boot 3)
The backend is structured into standard enterprise layers:
* **Controller (`controller/`)**: Decouples HTTP bindings. Exposes auth (`AuthController`), profile (`UserController`), feed (`PostController`), likes/comments (`LikeCommentController`), directory (`AlumniController`), and dedicated controllers for events, mentorship, referrals, jobs, achievements, reunions, and analytics.
* **Service (`service/`)**: Houses transaction boundaries, visibility authorization, and business logic (`AuthService`, `UserService`, `PostService`, `LikeCommentService`, `AlumniService`, and matching services for events, mentorship, referrals, jobs, achievements, reunions, and analytics).
* **Repository (`repository/`)**: Spring Data JPA query interfaces.
* **Entity (`entity/`)**: Maps PostgreSQL tables to Java POJOs.
* **DTO (`dto/`)**: Formulates strict JSON request/response schema specifications.
* **Security & Config (`security/`, `config/`)**: Manages CORS headers, Spring security permissions, JWT interceptor filters (`JwtFilter`), and Firebase Admin credentials.

---

## 🔒 Authentication Flow Detail

The authentication workflow strictly avoids trusting client-side validations alone. Below is the step-by-step state transition:

```
[Next.js Frontend]                [Firebase Auth API]            [Spring Boot Backend]             [PostgreSQL]
        |                                  |                               |                              |
        |--- 1. Click Google Login ------->|                               |                              |
        |<-- 2. Return Firebase Token -----|                               |                              |
        |                                                                  |                              |
        |--- 3. POST /api/auth/google (Firebase Token) ------------------->|                              |
        |                                                                  |--- 4. Verify ID Token ------>| (Firebase Cloud API)
        |                                                                  |<-- 5. Return Uid/Email ------|
        |                                                                  |                              |
        |                                                                  |--- 6. Search Uid/Email ----->|
        |                                                                  |<-- 7. User Found/Empty ------|
        |                                                                  |                              |
        |                                                                  |--- [If New] 8. Insert User ->|
        |                                                                  |                              |
        |                                                                  |--- 9. Sign Custom JWT ------>|
        |<-- 10. Return JWT + Profile + Onboarding Status -----------------|                              |
        |                                                                  |                              |
```

### Authentication Logic Breakdown
1. **Frontend Authentication Request**: The client requests Google OAuth using `signInWithPopup(auth, googleProvider)`. Upon successful login, the client retrieves an ID Token.
2. **Server-Side Verification**: The ID Token is sent to the backend. The backend executes `FirebaseAuth.getInstance().verifyIdToken(token)` to verify the signature.
3. **Database Insertion / Resolution**: The backend extracts `uid` and `email` from the verified token. It checks if the user exists in PostgreSQL. If not, it saves a new `User` record with the default role `USER`.
4. **JWT Generation**: The backend generates a signed JSON Web Token (JWT) with user details and claims.
5. **Dashboard Transition**: The client receives the JWT and profile metadata, caches them, and redirects to `/dashboard`.
6. **JWT Interceptor (`JwtFilter`)**: Subsequent API calls send the JWT in the `Authorization: Bearer <token>` header. The `JwtFilter` intercepts it, extracts the claims, validates the token against the database, and injects authority details into Spring's SecurityContext.
