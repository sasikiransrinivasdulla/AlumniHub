# Alumni Hub 🎓

[![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20Spring%20Boot%20%7C%20PostgreSQL-black)](https://github.com/sasikiransrinivasdulla/AlumniHub)
[![Java](https://img.shields.io/badge/Java-21-orange)](https://www.oracle.com/java/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-blue)](https://alumni-hub-sigma.vercel.app)
[![Render](https://img.shields.io/badge/Backend-Render-green)](https://alumnihub-onky.onrender.com)

Alumni Hub is an enterprise-grade social networking platform built exclusively for university alumni. By utilizing robust identity verification via Google OAuth and Firebase, it provides classmates with a secure, private community where they can reconnect, share experiences, and network.

---

## 🌟 Highlights

- **Production Deployment**: Live production-grade deployment with Vercel hosting the frontend, Render running the Spring Boot backend, and Neon powering the serverless PostgreSQL database.
- **Enterprise Authentication**: Secure, verified identity provisioning combining Google Sign-In, Firebase Client authentication, and server-side token validation.
- **Community-Based Access Control**: Advanced privacy filter logic. Visibility of directory lists, feeds, and profiles is restricted dynamically based on user community credentials (academic batch, department, or section).
- **JWT Security**: State-of-the-art request authorization utilizing custom-signed application JSON Web Tokens (JJWT 0.12.6) for subsequent REST calls.
- **Real-Time Communication**: Seamless chat experience and instant push alerts using a dedicated WebSocket channel utilizing STOMP protocol, SockJS, and custom inbound interceptors.
- **Responsive UI**: Premium, high-fidelity black monochrome theme designed using Tailwind CSS that is optimized for desktops, tablets, and mobile devices.
- **Cloud-Native Architecture**: Upstash Redis SSL configuration for caching and Cloudinary configuration for hosting post-sharing images & videos.

---

## 🌐 Live Deployment

- **Frontend Application**: [https://alumni-hub-sigma.vercel.app](https://alumni-hub-sigma.vercel.app)
- **Backend Application API**: [https://alumnihub-onky.onrender.com](https://alumnihub-onky.onrender.com)

---

## 🚀 Features

### 🔐 Authentication & Security
- **Secure Google Sign-In**: Client-side Firebase OAuth integration using interactive sign-in popups.
- **Server Verification**: Secure server-side validation of Google ID tokens using the Firebase Admin SDK.
- **Automatic Provisioning**: Seamless database lookup and automatic signup provisioning for first-time login users.
- **Custom JWT Auth**: High-performance session security using signed JSON Web Tokens for API requests.

### 🛡️ Community & Access Control
- **Visibility Restrictions**: Visibility bounds automatically enforced across CST, ECT (restricted to matching Batch + Department) and CSE, ECE, EEE, MECH, CIVIL, AIML, CAI (restricted to matching Batch + Department + Section).
- **API Guarding**: Detail queries throw a `403 Forbidden` error if requested content belongs to a classmate outside the user's community bounds.

### 📢 Social Platform
- **Alumni Memories Feed**: Publish and browse recent college or graduation photos and MP4/WebM videos up to 30MB along with descriptive captions.
- **Memory of the Day**: A dedicated algorithm showcasing a single random community post daily based on a calendar date-seeded calculation.
- **Likes & Comments System**: Toggle likes, view total counts, and write comments up to 500 characters.
- **Ownership Verification**: Safe editing where comment deletion and actions are strictly constrained to the author.

### 👤 User Profiles
- **Profile Management**: Update user metadata (full name, phone, biography, Instagram, LinkedIn, and GitHub links).
- **Custom Profile Badges**: Customize professional credentials (e.g. Mentor, Entrepreneur, Hiring, Reunion Organizer) shown on user cards.
- **Open To Preferences**: Allow users to specify mentoring, hiring, and career guidance options.
- **Conditional Branch Validations**: Software branches (CSE, CST, AIML, CAI) require GitHub URLs, while non-software branches maintain it as optional.
- **Mandatory Setup Wall**: Route locking that blocks dashboard view access until graduation and section setup is completed.

### 💬 Messaging & Notifications
- **Real-Time Message Delivery**: Group messaging and peer chats powered by STOMP over WebSockets.
- **Notification Center Drawer**: Grouped alerts (Today, Yesterday, Earlier) with single read, mark all read, and alert deletion options.
- **Browser Push Notifications**: Native browser pushes triggered dynamically on WebSocket alerts when the application tab is out of focus.

### 🖼️ Media & Storage
- **Cloudinary Image/Video Hosting**: Fast, high-performance upload pipelines for images and MP4/MOV/WebM video memories.
- **Upstash SSL Caching**: Encrypted Redis caching for feed lists and comment threads.

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React, TypeScript, Tailwind CSS, Firebase Client SDK, STOMP/SockJS, Context API |
| **Backend** | Java 21, Spring Boot 3.3.4, Spring Security, Spring Data JPA, Hibernate, JJWT 0.12.6, Firebase Admin SDK, Redis SSL Caching, WebSockets, Maven |
| **Database** | PostgreSQL (Neon Serverless DB) |
| **Media Hosting**| Cloudinary API |
| **Deployment** | Vercel (Frontend), Render (Backend) |

---

## 📐 Project Architecture

```text
                  +-----------------------------------+
                  |           Google OAuth            |
                  +-----------------------------------+
                                    |
                                    v
                  +-----------------------------------+
                  |       Firebase Auth Client        |
                  +-----------------------------------+
                                    |
                                    v
+------------+    +-----------------------------------+    +----------------------+
| Cloudinary |<-->|          Next.js Frontend         |<-->| WebSocket Connection |
| (Media)    |    +-----------------------------------+    |   (STOMP / SockJS)   |
+------------+                      |                      +----------------------+
                                    | REST APIs + JWT                 ^
                                    v                                 |
                  +-----------------------------------+               |
                  |        Spring Boot Backend        |               |
                  +-----------------------------------+               |
                                    |                                 |
                                    v                                 |
                  +-----------------------------------+               |
                  |        Spring Security            |<--------------+
                  +-----------------------------------+
                                    |
                                    |--[ Firebase Admin SDK ]
                                    v
                  +-----------------------------------+
                  |           Service Layer           |<===> [ Upstash Redis SSL ]
                  +-----------------------------------+
                                    |
                                    v
                  +-----------------------------------+
                  |         Repository Layer          |
                  +-----------------------------------+
                                    |
                                    v
                  +-----------------------------------+
                  |        PostgreSQL Database        |
                  +-----------------------------------+
```

---

## 📂 Folder Structure

```text
AlumniHub/
├── backend/                        # Spring Boot 3 Backend Application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/alumnihub/
│   │   │   │   ├── config/         # Third-party configurations (Firebase, Cloudinary, Redis, WebSockets)
│   │   │   │   ├── controller/     # REST Controllers mapping request endpoints
│   │   │   │   ├── dto/            # Data Transfer Objects for client-server serialization
│   │   │   │   ├── entity/         # JPA Domain Entities representing PostgreSQL tables
│   │   │   │   ├── repository/     # Data access layer extending JpaRepository 
│   │   │   │   ├── security/       # JWT Filters, token utilities, and web security chain configuration
│   │   │   │   └── service/        # Core transaction-bound business logic services
│   │   │   └── resources/          # Resource configurations and properties
│   │   └── test/                   # JUnit integration and unit test suite
│   ├── pom.xml                     # Maven project configuration and dependencies
│   └── .env.example                # Template for backend secret properties
│
├── frontend/                       # Next.js 16 Client Application
│   ├── app/                        # App Router defining route segments (dashboard, directories, share)
│   ├── components/                 # Reusable UI components (Sidebar, modal, feeds)
│   ├── lib/                        # Client-side configuration utilities (Firebase initialized app)
│   ├── services/                   # Fetch clients calling REST endpoints (auth, post, chat, profiles)
│   ├── package.json                # npm dependencies and build tasks
│   └── .env.example                # Template for client environment properties
│
└── docs/                           # Core Technical documentation and architectures
```

---

## 🔐 Environment Variables

Before starting locally, configure your environment variables.

### Frontend (`frontend/.env.local`)
Create a `frontend/.env.local` file by copying the `frontend/.env.example` template:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Backend (`backend/.env`)
Create a `backend/.env` file by copying the `backend/.env.example` template:
```env
DATABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET=your_base64_encoded_jwt_secret_key
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
REDIS_HOST=your_upstash_host
REDIS_PORT=your_upstash_port
REDIS_PASSWORD=your_upstash_password
```

---

## 💻 Local Setup & Running

### Prerequisites
* Java 21 JDK installed
* Node.js v18+ and npm installed
* Running PostgreSQL database and Redis instance

### Running the Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Setup environment variables:
   ```bash
   cp .env.example .env
   ```
3. Compile and start the application:
   ```bash
   ./mvnw spring-boot:run
   ```
   The API server will run on [http://localhost:8080](http://localhost:8080).

### Running the Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Setup client environment variables:
   ```bash
   cp .env.example .env.local
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the client.

---

## 📋 API Reference

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/api/auth/google` | `POST` | Authenticates Firebase Google ID Token & returns app JWT | No |
| `/api/health` | `GET` | Health status checker | No |
| `/api/user/me` | `GET` | Returns currently authenticated user profile | Yes (JWT) |
| `/api/user/me` | `PUT` | Updates profile details (biography, badges, open-to options) | Yes (JWT) |
| `/api/alumni` | `GET` | List classmates within community visibility bounds | Yes (JWT) |
| `/api/alumni/{id}` | `GET` | Retrieve complete details of a specific alumnus | Yes (JWT) |
| `/api/alumni/search` | `GET` | Search directory by company, position, badge, or openTo | Yes (JWT) |
| `/api/posts` | `POST` | Post a college memory with caption & image or video url | Yes (JWT) |
| `/api/posts/feed` | `GET` | List chronological memories feed filtered by community | Yes (JWT) |
| `/api/posts/{id}` | `GET` | Retrieve details of a specific memory post | Yes (JWT) |
| `/api/posts/memory-of-the-day` | `GET` | Retrieve date-seeded random featured memory | Yes (JWT) |
| `/api/posts/{id}/like` | `POST` | Toggle like state (like/unlike) | Yes (JWT) |
| `/api/posts/{id}/comments`| `GET` | List comments array for a post | Yes (JWT) |
| `/api/posts/{id}/comments`| `POST` | Submit comment under memory post (max 500 chars) | Yes (JWT) |
| `/api/comments/{id}` | `DELETE`| Remove a specific comment (limited to comment creator) | Yes (JWT) |
| `/api/upload/post-video` | `POST` | Upload video file to Cloudinary (max 30MB) | Yes (JWT) |
| `/api/notifications` | `GET` | Fetch paginated alerts list | Yes (JWT) |
| `/api/notifications/unread-count` | `GET` | Fetch count of unread alerts | Yes (JWT) |
| `/api/notifications/read` | `POST` | Mark all user notifications as read | Yes (JWT) |
| `/api/notifications/{id}/read` | `POST` | Mark single notification as read | Yes (JWT) |
| `/api/notifications/{id}` | `DELETE` | Delete single notification alert | Yes (JWT) |
| `/api/notifications/reunion-test` | `POST` | Trigger dummy reunion invite notification | Yes (JWT) |
| `/api/notifications/event-test` | `POST` | Trigger dummy event reminder notification | Yes (JWT) |

---

## 🗺️ Roadmap

### Completed Features
- [x] Next.js 16 Client App Router & Spring Boot 3 Framework integrations.
- [x] Complete Google OAuth Authentication flow via Firebase Client & Server SDKs.
- [x] Custom JJWT application tokens for secure API queries.
- [x] Mandated onboarding page redirect locking feed/directory access.
- [x] Classmate directories listing and search query filtering.
- [x] Photo upload pipeline utilizing Cloudinary file storage.
- [x] Video memories uploading and layout rendering.
- [x] Daily random featured Memory of the Day.
- [x] Smart networking suggestion reason matching.
- [x] Profile badges and open-to preference selectors.
- [x] Dynamic grouped notifications center drawer.
- [x] Native browser push alerts triggers.
- [x] Social feed offering memory posts, like toggles, and nested comments.
- [x] WebSocket channel for STOMP Messaging and notifications.
- [x] Live cloud deployments on Vercel and Render using Neon serverless database.

---

## 👤 Author

* **Sasikiran Srinivas Dulla** - *Full Stack Developer* - [GitHub Profile](https://github.com/sasikiransrinivasdulla)
