# Production Deployment Guide

This document covers configurations, runtime variables, and steps to build and run Alumni Hub in a production environment (such as Render, AWS, Heroku, or Docker).

---

## 🛠️ Required Production Environment Variables

### Backend Service (Spring Boot)

The backend expects these keys configured in the operating system environment or a `.env` file:

| Variable | Sample Value | Purpose |
|---|---|---|
| `PORT` | `8080` | Port for embedded web server binding (Required by Render). |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | Database connection string. Mapped dynamically to Spring JDBC keys. |
| `UPSTASH_REDIS_URL` | `redis://default:token@host:port` | Upstash/Redis connection endpoint for cache service configurations. |
| `FIREBASE_CREDENTIALS_JSON` | `{"type": "service_account", ...}` | JSON string containing Firebase Service Account Credentials. |
| `CLOUDINARY_URL` | `cloudinary://key:secret@name` | Cloudinary settings for image/video upload processing. |
| `JWT_SECRET` | `long-secret-key-at-least-256-bits` | HS256 hashing secret. |

### Frontend Service (Next.js Client)

Configure these keys for the static compilation layer:

| Variable | Sample Value | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://alumnihub-api.onrender.com` | Base endpoint of backend APIs. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyA...` | Firebase config parameter. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `alumnihub.firebaseapp.com` | Firebase config parameter. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `alumnihub` | Firebase config parameter. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`| `alumnihub.appspot.com` | Firebase config parameter. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`| `1234567890` | Firebase config parameter. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:12345:web:abc` | Firebase config parameter. |

---

## 🐳 Docker Compose Quickstart

Deploy the complete application ecosystem locally or on single-instance VMs:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: alumnihub
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/alumnihub
      - UPSTASH_REDIS_URL=redis://redis:6379
      - JWT_SECRET=supersecretproductionkeychangeit
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8080
    depends_on:
      - backend
```

Build and start the ecosystem:
```bash
docker-compose up -d --build
```
