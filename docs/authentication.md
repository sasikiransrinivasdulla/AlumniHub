# Authentication & Role Authorization

Alumni Hub coordinates client authentication using Firebase Auth (for provider sign-ins) and Spring Boot custom JWT claims (for session execution and role mapping).

---

## 🔑 Step-by-Step Flow

```mermaid
sequenceDiagram
    participant C as Next.js Client
    participant F as Firebase Cloud
    participant S as Spring Boot Server
    participant DB as PostgreSQL DB
    
    C->>F: 1. Google OAuth Popup login
    F-->>C: 2. Return client credential ID Token
    C->>S: 3. POST /api/auth/google (IdToken)
    S->>F: 4. FirebaseAdmin.verifyIdToken(token)
    F-->>S: 5. Return Uid & verified Email
    S->>DB: 6. Query User by Uid/Email
    alt User is new
        S->>DB: 7. Save user metadata (ROLE = 'USER')
    end
    S->>S: 8. Generate JWT (subject = email, claim = ID / role)
    S-->>C: 9. Return JWT, profile & completing flag
    C->>C: 10. Cache JWT & route to workspace
```

---

## 🔒 JWT Details
The custom JWT contains authorization claims used to inject user permissions directly into Spring Boot.

### Claims Payload
- **Subject (`sub`)**: User email address.
- **Roles Claim (`roles`)**: User permissions list (e.g. `["ROLE_USER"]`).
- **User ID (`userId`)**: Unique profile database UUID.
- **Expiration (`exp`)**: Configured duration (Default: 7 days).

---

## 🛠️ Server Security Configuration
Spring Security is configured using a custom WebSecurity config:
- **CORS Configuration**: Explicitly permits request headers from Next.js domain.
- **State Management**: Session stateless policy (`SessionCreationPolicy.STATELESS`).
- **Request Permissions**:
  - `/api/auth/**` permitted for anonymous access.
  - `/ws-chat/**` permitted for websocket handshake initialization.
  - All other `/api/**` endpoints require authentication.
- **Filter Chain**: Custom `JwtFilter` checks incoming `Authorization` request headers, verifies JWT signature, and populates `SecurityContextHolder`.
