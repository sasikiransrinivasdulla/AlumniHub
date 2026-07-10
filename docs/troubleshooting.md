# System Troubleshooting & Diagnostic Guide

This document lists standard error resolutions, database sync steps, and WebSocket debugging practices for Alumni Hub.

---

## 🛠️ Common Backend Issues

### 1. Database Connection Failures
* **Symptom**: `Failed to obtain JDBC Connection` on server boot.
* **Resolution**: Verify that the database is running and credentials match. If deploying to Render with a dynamic DATABASE_URL, check that the parser in `AlumniHubApplication.java` has parsed it:
  - Format must start with `postgres://` or `postgresql://`.
  - Ensure the database allows external connection routing (SSL Mode might require `sslmode=require`).

### 2. Hibernate Schema Update Conflicts
* **Symptom**: `Schema-validation: missing table` or `type mismatch`.
* **Resolution**: If schema alterations conflict with existing configurations, toggle Hibernate configuration properties in `backend/src/main/resources/application.properties`:
  ```properties
  spring.jpa.hibernate.ddl-auto=update
  ```
  In production, use database migration tools (like Liquibase or Flyway) to perform migrations.

---

## 💻 Common Frontend Issues

### 1. CORS Preflight Blocks
* **Symptom**: Console prints `CORS policy: No 'Access-Control-Allow-Origin' header is present`.
* **Resolution**: Verify that the server configuration file (`WebConfig.java` or `SecurityConfig.java`) explicitly registers the client port or domain. Add the Next.js port (e.g., `http://localhost:3000`) to the CORS permitted list.

### 2. WebSocket Connection Dropping
* **Symptom**: `WebSocket connection to 'ws://...' failed` in browser log.
* **Resolution**: 
  - Ensure the gateway URL matches. In production, secure `wss://` protocol must be used.
  - Verify that reverse proxies (Nginx, Cloudflare, AWS ALB) allow WebSocket connections (specifically headers `Upgrade: websocket` and `Connection: Upgrade`).

### 3. Hydration Mismatch Warnings
* **Symptom**: Console prints `Warning: Text content did not match. Server: "..." Client: "..."`.
* **Resolution**: Mismatches occur when formatting dates (`toLocaleDateString()`) during server pre-renders. Use the `suppressHydrationWarning` attribute on the element:
  ```tsx
  <span suppressHydrationWarning>{new Date(dateStr).toLocaleDateString()}</span>
  ```
