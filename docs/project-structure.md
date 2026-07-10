# Project Structure Map

This document describes the folder layout and files inside the Alumni Hub codebase.

---

## 🏛️ Directory Layout overview

```
AlumniHub/
├── backend/                       # Spring Boot Service Layer
│   ├── src/
│   │   └── main/java/com/alumnihub/
│   │       ├── AlumniHubApplication.java  # Main Boot Bootstrapper
│   │       ├── config/            # Web MVC, WebSocket config, CORS
│   │       ├── controller/        # REST Endpoint Controllers
│   │       ├── dto/               # Request/Response Data Objects
│   │       ├── entity/            # JPA Hibernate Entity Tables
│   │       ├── exception/         # Controller advices & custom errors
│   │       ├── repository/        # Spring Data JPA Repository bindings
│   │       ├── security/          # JwtFilter & WebSecurity Configurations
│   │       ├── service/           # Core Logic & Transactions
│   │       └── util/              # JWT & String helpers
│   └── pom.xml                    # Maven Dependency Manifest
│
├── frontend/                      # Next.js Client Layer
│   ├── app/                       # Page routing (App Router)
│   │   ├── layout.tsx             # Root layout with socket context
│   │   ├── page.tsx               # Login & authentication view
│   │   ├── dashboard/             # Memories feed dashboard
│   │   ├── directory/             # Classmate directory & filters
│   │   ├── alumni/[id]/           # Member profiles & connection options
│   │   ├── messages/              # Direct chat workspaces
│   │   ├── events/                # Reunions, webinar RSVPs
│   │   └── profile/setup/         # Mandatory onboarding profile completion
│   ├── components/                # Shared structures (Sidebar, Toasts)
│   ├── constants/                 # Central constants (profileConstants.ts)
│   ├── context/                   # Context wrappers (SocketContext.tsx)
│   ├── hooks/                     # Custom hook libraries (useModal.ts)
│   ├── services/                  # Backend REST API wrappers
│   ├── styles/                    # Global stylesheet bindings
│   └── package.json               # Node Module configurations
```

---

## 📁 Key File Responsibilities

### Backend Core
- **`AlumniHubApplication.java`**: Bootstraps the container, loads environment credentials from local `.env` configuration files, and configures database connection pools dynamically using JDBC formatting.
- **`JwtFilter.java`**: Validates JWT bearer tokens in the authorization header and configures Spring's local `SecurityContext`.
- **`GlobalExceptionHandler.java`**: Formulates unified client JSON responses for bad requests, security blocks, or validation issues.

### Frontend Core
- **`SocketContext.tsx`**: Encapsulates active WebSocket handshakes, sub-inboxes, and dispatches native browser alerts when conversations receive new messages in the background.
- **`profileConstants.ts`**: Holds auto-generated academic year batches (2010-2030), course department configurations, and class section mappings.
- **`useModal.ts`**: Formulates clean visual modal backdrops, supports closing on escape click, and manages accessibility focus trapping.
