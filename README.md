# Alumni Hub 🎓

Alumni Hub is an enterprise-grade social networking and career development platform built exclusively for university alumni. Combining Google OAuth validation, real-time WebSocket communication, and community-based access control, it provides a premium portal for networking, job referrals, and sharing memories.

---

## 🚀 Live Deployments

- **Web Application Client**: [https://alumni-hub-sigma.vercel.app](https://alumni-hub-sigma.vercel.app)
- **Backend Service REST API**: [https://alumnihub-onky.onrender.com](https://alumnihub-onky.onrender.com)

---

## 🏛️ System Architecture

Alumni Hub utilizes a decoupled Client-Server architecture:

```mermaid
graph TD
    Client[Next.js Client app] -->|HTTPS REST| SpringBoot[Spring Boot Backend REST API]
    Client -->|WebSockets STOMP| STOMP[WebSocket STOMP Broker]
    SpringBoot -->|JPA / Hibernate| PG[(PostgreSQL Database)]
    SpringBoot -->|Redis Cache| Redis[(Upstash Redis Cache)]
```

---

## 🛠️ Technology Stack

| Tier | Technology Suite |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React, TypeScript, Tailwind CSS, Framer Motion, Firebase Client SDK, STOMP/SockJS |
| **Backend** | Java 21, Spring Boot 3.3.4, Spring Security, Spring Data JPA, Hibernate, JJWT, Firebase Admin SDK, WebSockets |
| **Data & Cache** | PostgreSQL (Neon), Upstash Redis Cache |
| **Media Store** | Cloudinary |

---

## 📚 Complete Project Documentation

| Category | File | Description |
|:---|:---|:---|
| **Core Architecture** | [architecture.md](docs/architecture.md) | High-level system layout, Auth sequence, request lifecycle. |
| **Backend Service** | [backend-architecture.md](docs/backend-architecture.md) | Spring Boot layers, Transaction policies, global exceptions. |
| **Frontend Client** | [frontend-architecture.md](docs/frontend-architecture.md) | Next.js layout structures, Socket Context, caching strategies. |
| **Data Schema** | [database.md](docs/database.md) | PostgreSQL table properties, relationships, database indexes. |
| **Endpoints** | [api-reference.md](docs/api-reference.md) | Full details on REST routes, payload request/response examples. |
| **Authentication** | [authentication.md](docs/authentication.md) | Step-by-step token verification flow and JWT mappings. |
| **Real-time Engine** | [websocket.md](docs/websocket.md) | STOMP configurations, destination subscriptions, alert channels. |
| **Infrastructure** | [deployment.md](docs/deployment.md) | Production environment variables setup, Docker Compose quickstart. |
| **Security Controls**| [security.md](docs/security.md) | Data protection filters, privacy gates, upload verifications. |
| **Performance** | [performance.md](docs/performance.md) | JPA index adjustments, bulk update optimizations, TTL caching. |
| **Structure Map** | [project-structure.md](docs/project-structure.md) | Visual directories trees of backend and frontend workspaces. |
| **Troubleshooting** | [troubleshooting.md](docs/troubleshooting.md) | Common environment error fixes and diagnostics. |
| **Development** | [development-guide.md](docs/development-guide.md) | Local system setup, launch scripts, database creation. |
| **Future Planning** | [future-roadmap.md](docs/future-roadmap.md) | Upcoming features: search performance scaling, React Native app. |

---

## ⚡ Quick Start

### 1. Configure Credentials
Create a `.env` file in the root workspace folder:
```properties
DATABASE_URL=postgresql://postgres:password@localhost:5432/alumnihub
JWT_SECRET=supersecretlocaldevelopmentkeyatleast256bitslong
FIREBASE_CREDENTIALS_JSON={"type":"service_account",...}
```

### 2. Launch Services
Start the PostgreSQL database, then run:

**Backend API**:
```bash
cd backend && ./mvnw spring-boot:run
```

**Frontend Client**:
```bash
cd frontend && npm install && npm run dev
```

The portal will boot on `http://localhost:3000`.
