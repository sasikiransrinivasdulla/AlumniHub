# Enterprise Architecture Blueprint

Alumni Hub is engineered using a decoupled Client-Server architecture. This document serves as the high-level technical blueprint of the platform.

---

## 🏛️ System Overview

```mermaid
graph TD
    Client[Next.js Client app] -->|HTTPS REST| SpringBoot[Spring Boot Backend REST API]
    Client -->|WebSockets STOMP| STOMP[WebSocket STOMP Broker]
    SpringBoot -->|JPA / Hibernate| PG[(PostgreSQL Database)]
    SpringBoot -->|Redis Queries| Redis[(Upstash Redis Cache)]
    SpringBoot -->|OAuth check| Firebase[(Firebase Auth API)]
```

- **Frontend client**: A Next.js App Router Single Page Application (SPA) utilizing Tailwind CSS styling and real-time STOMP connection mappings.
- **Backend service**: A Stateless Spring Boot REST API coordinating security configurations, database connections, and event mappings.
- **Cache layer**: Upstash Redis (for server caching) and `requestCache` TTL cache (for client-side UI request caching).

---

## 🔒 End-To-End Authentication Flow

All security operations require token validation. The diagram below details token exchange logic:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser as Next.js App
    participant Firebase as Firebase OAuth
    participant Backend as Spring Boot API
    participant DB as PostgreSQL DB
    
    User->>Browser: Click login
    Browser->>Firebase: signInWithPopup(Google)
    Firebase-->>Browser: Return ID Token (Credential)
    Browser->>Backend: POST /api/auth/google (IdToken)
    Backend->>Firebase: Validate signature
    Firebase-->>Backend: Token is valid (Email/Uid)
    Backend->>DB: Query User profile by Email
    alt User is new
        Backend->>DB: Create profile (ROLE_USER)
    end
    Backend->>Backend: Sign JWT (roles, userId, email)
    Backend-->>Browser: Return JWT + Onboarding status
```

---

## ⚙️ Request Lifecycle Flow

Every authenticated HTTP request to the API undergoes a series of validation, authorization, and translation phases:

```mermaid
graph TD
    Request[HTTP Request with Header JWT] --> FilterChain[Spring JwtFilter]
    FilterChain -->|Token validation fails| Err401[401 Unauthorized Response]
    FilterChain -->|Token passes| SecurityContext[Inject Authentication into SecurityContext]
    SecurityContext --> DispatcherServlet[Spring DispatcherServlet]
    DispatcherServlet --> Controller[Target Controller Layer]
    Controller -->|DTO Validation fails| Err400[400 Bad Request Response]
    Controller --> Service[Service Layer / Business Logic]
    Service -->|Authorization check fails| Err403[403 Forbidden Response]
    Service --> Repository[Repository Data Access / Transaction Commit]
    Repository --> DtoMapping[Map entities to Dto response]
    DtoMapping --> Response[200 OK Response]
```
