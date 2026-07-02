# Developer Walkthrough

This document guides developers through setting up, compiling, testing, and running the **Alumni Hub** project.

---

## 🛠️ Step-by-Step Local Setup

### 1. Repository Clone
Ensure the project is cloned locally:
```bash
git clone https://github.com/sasikiransrinivasdulla/AlumniHub.git
cd AlumniHub
```

### 2. Database Provisioning
This application utilizes a PostgreSQL database. Ensure you have a PostgreSQL connection string ready. If using **Neon DB**:
- Obtain the database URL (e.g. `postgresql://user:pass@ep-shiny-shadow.aws.neon.tech/neondb?sslmode=require`).
- The application dynamically parses the `DATABASE_URL` at startup into JDBC attributes.

### 3. Backend Setup
1. Enter the backend folder:
   ```bash
   cd backend
   ```
2. Create your `.env` configuration file from the template:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and fill in the database URL, JWT secret key, and Firebase Admin credentials.
4. Clean and compile the Java sources:
   ```bash
   ./mvnw clean compile
   ```

### 4. Frontend Setup
1. Enter the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Create your `.env.local` configuration file:
   ```bash
   cp .env.example .env.local
   ```
3. Open `.env.local` and configure your backend endpoint API URL and Firebase Web credentials.
4. Install npm dependencies:
   ```bash
   npm install
   ```

---

## 🧪 Running the Test Suites

### Backend Unit & Integration Tests
We have built integration tests utilizing Mockito to simulate OAuth flow without querying live Google endpoints.
Run the test phase:
```bash
cd backend
./mvnw test
```
The test suite performs the following validations:
- **`AlumniHubApplicationTests.contextLoads`**: Assures Hibernate, Hikari, PostgreSQL connection drivers, and Firebase configurations load successfully.
- **`AuthControllerTest`**: Mocks the Firebase Admin SDK token decryption, verifies dynamic user creation in PostgreSQL, resolves the onboarding status to `PENDING_ONBOARDING`, and verifies the JWT token return structure.
- **`UserControllerTest`**: Tests profile fetching (`GET /api/user/me`), success path profile updates (`PUT /api/user/me`), inputs validation enforcement (such as exactly 10-digit phone numbers, max 250-character bio length, valid LinkedIn and GitHub URL patterns, trailing slashes, conditional GitHub requirement checks based on selected department, and new Instagram URL validations), and unauthenticated endpoint rejection.
- **`PostControllerTest`**: Asserts post creation (`POST /api/posts`), academic community filtering for custom feed displays (`GET /api/posts/feed`), and detail-level visibility enforcement (`GET /api/posts/{id}`) returning 403 Forbidden for unauthorized requests.
- **`LikeCommentControllerTest`**: Asserts likes toggling behavior, comment submission, character length constraints, and comment deletion restricted to comment owners.
- **`AlumniControllerTest`**: Asserts community-restricted directory listings (`GET /api/alumni`), name/position directory searches (`GET /api/alumni/search`), and target detailed profile checks returning 403 Forbidden for out-of-community requests.

---

## 🏃 Running Applications

### Start Backend Dev Server
```bash
cd backend
./mvnw spring-boot:run
```
The server will run on `http://localhost:8080`.

### Start Frontend Dev Server
```bash
cd frontend
npm run dev
```
The server will run on `http://localhost:3000`.

---

## 🏁 Verification Checklists

### 1. Build Verification
Ensure both platforms compile and bundle without error:
- Backend: `./mvnw clean compile` output should conclude with `BUILD SUCCESS`.
- Frontend: `npm run build` should successfully generate pages without TypeScript or build issues.

### 2. Schema Creation
Upon running the backend, Hibernate's `spring.jpa.hibernate.ddl-auto=update` automatically checks PostgreSQL and creates the `users` table schema if not already present.
