# Local Development Setup Guide

This guide walks you through setting up a local development environment for the Alumni Hub platform.

---

## 📋 Prerequisites

Install the following dependencies on your workstation:
- **Java JDK**: Version 17 or higher
- **Node.js**: Version 18 or higher (LTS recommended)
- **PostgreSQL**: Version 14 or higher
- **Firebase Account**: Required for authentication configuration

---

## 🛠️ Step-by-Step Installation

### Step 1. Clone & Database Init
Create a local database for the application:
```sql
CREATE DATABASE alumnihub;
```

### Step 2. Configure Environment Files
Create a `.env` file in the workspace root directory:
```properties
# Backend parameters
PORT=8080
DATABASE_URL=postgresql://postgres:password@localhost:5432/alumnihub
JWT_SECRET=supersecretlocaldevelopmentkeyatleast256bitslong
FIREBASE_CREDENTIALS_JSON={"type":"service_account",...}
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Frontend parameters (also duplicate to /frontend/.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=alumnihub.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=alumnihub
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=alumnihub.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:12345:web:abc
```

### Step 3. Launch the Backend API
Navigate to the backend directory and launch using the Maven wrapper:
```bash
cd backend
./mvnw spring-boot:run
```
The server will start on port `8080`. Validate connection to PostgreSQL.

### Step 4. Launch the Next.js Client
Open a new terminal tab, navigate to the frontend folder, install npm packages, and start the development server:
```bash
cd frontend
npm install
npm run dev
```
The client dashboard will start on `http://localhost:3000`.

---

## 🧪 Seeding Local Mock Data
To test features like search directory, classmate recommendations, or event participation:
1. Complete onboarding for the first account to populate profile tables.
2. Manually or programmatically insert records into PostgreSQL to build connections.
3. Utilize the recommendation logic which matches shared batches, skills, and cities.
