# API Documentation

This document describes the API contracts and endpoints for the Alumni Hub authentication system.

---

## 🔐 Authentication Endpoint

### Google OAuth Verification

Verifies a client-side Firebase ID token, provisions the user profile in the database, and issues an application-specific JWT.

* **Endpoint**: `/api/auth/google`
* **HTTP Method**: `POST`
* **Content-Type**: `application/json`
* **Access Control**: Public (Permit All)

#### Request Payload
```json
{
  "firebaseToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

##### Parameters
| Field | Type | Required | Description |
|---|---|---|---|
| `firebaseToken` | String | Yes | The cryptographically signed ID token obtained from Firebase Auth client SDK. |

#### Success Response
* **Status Code**: `200 OK`
* **Content-Type**: `application/json`

##### Response Body
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "firebaseUid": "firebase-uid-12345",
    "email": "user@gmail.com",
    "fullName": "John Doe",
    "profilePicture": "https://lh3.googleusercontent.com/a/...",
    "batch": null,
    "department": null,
    "section": null,
    "bio": null,
    "currentPosition": null,
    "phoneNumber": null,
    "linkedinUrl": null,
    "githubUrl": null,
    "profileCompleted": false,
    "role": "USER",
    "createdAt": "2026-06-30T12:00:00.000",
    "updatedAt": "2026-06-30T12:00:00.000"
  },
  "authStatus": "PENDING_ONBOARDING"
}
```

##### Response Fields
| Field | Type | Description |
|---|---|---|
| `token` | String | Signed custom JWT issued by the backend for validating future requests. Includes role and user ID claims. |
| `user` | Object | The mapped profile entity stored in PostgreSQL database. |
| `authStatus` | String | Authentication state: `PENDING_ONBOARDING` (if graduation details are empty) or `ONBOARDED` (if onboarding is complete). |

---

## 👤 User Profile Endpoints

### Get Current User Profile

Retrieves the authenticated user's profile information.

* **Endpoint**: `/api/user/me`
* **HTTP Method**: `GET`
* **Access Control**: Authenticated (Requires `Authorization: Bearer <JWT_token>` header)

#### Success Response
* **Status Code**: `200 OK`
* **Content-Type**: `application/json`

##### Response Body
```json
{
  "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "firebaseUid": "firebase-uid-12345",
  "email": "user@gmail.com",
  "fullName": "John Doe",
  "profilePicture": "https://lh3.googleusercontent.com/a/...",
  "batch": "2020-2024",
  "department": "CSE",
  "section": "A",
  "bio": "Software engineering graduate.",
  "currentPosition": "Frontend Intern",
  "phoneNumber": "9876543210",
  "linkedinUrl": "https://linkedin.com/in/john-doe",
  "githubUrl": "https://github.com/john-doe",
  "instagramUrl": "https://instagram.com/john-doe",
  "profileCompleted": true,
  "role": "USER",
  "createdAt": "2026-06-30T12:00:00.000",
  "updatedAt": "2026-06-30T12:15:00.000"
}
```

---

### Update User Profile

Updates editable details of the currently authenticated user's profile.

* **Endpoint**: `/api/user/me`
* **HTTP Method**: `PUT`
* **Content-Type**: `application/json`
* **Access Control**: Authenticated (Requires `Authorization: Bearer <JWT_token>` header)

#### Request Payload
```json
{
  "fullName": "John Doe",
  "batch": "2020-2024",
  "department": "CSE",
  "section": "A",
  "bio": "Software engineering graduate with interest in web applications.",
  "currentPosition": "Frontend Developer",
  "phoneNumber": "9876543210",
  "linkedinUrl": "https://linkedin.com/in/john-doe",
  "githubUrl": "https://github.com/john-doe",
  "instagramUrl": "https://instagram.com/john-doe"
}
```

##### Validation Constraints
- `fullName`: Optional/Required, max 100 characters.
- `batch`: Dropdown options between `2000-2004` and `2023-2027`.
- `department`: Dropdown option (`CST`, `CSE`, `ECE`, `ECT`, `AIML`, `CAI`, `EEE`, `MECH`, `CIVIL`).
- `section`: Dynamic department-based (`CSE` -> A/B/C/D, `CST`/`ECT` -> None).
- `bio`: Max 250 characters.
- `currentPosition`: Max 100 characters.
- `phoneNumber`: Must be exactly 10 digits (`^[0-9]{10}$`).
- `linkedinUrl`: Optional, valid LinkedIn URL format.
- `githubUrl`: Conditionally required for software branches (`CSE`, `CST`, `AIML`, `CAI`); optional for others. Must be a valid GitHub URL format (allows trailing slash).
- `instagramUrl`: Optional, valid Instagram URL format.
- Email and Firebase UID cannot be updated.

#### Success Response
* **Status Code**: `200 OK`
* **Content-Type**: `application/json`
* **Body**: Returns the updated user profile object (same structure as `GET /api/user/me`).

---

## 📸 Memories Feed Endpoints

### Create a Post
Creates a new post memory.

* **Endpoint**: `/api/posts`
* **HTTP Method**: `POST`
* **Content-Type**: `application/json`
* **Access Control**: Authenticated (Requires `Authorization: Bearer <JWT_token>` header)

#### Request Payload
```json
{
  "imageUrl": "https://example.com/memories.jpg",
  "caption": "Graduation Day!"
}
```

#### Success Response
* **Status Code**: `200 OK`
* **Content-Type**: `application/json`
* **Body**:
```json
{
  "id": "b0f78a2d-ec34-4b5f-90c6-b3ca836f21df",
  "userId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "userFullName": "John Doe",
  "userProfilePicture": "https://lh3.googleusercontent.com/...",
  "userCurrentPosition": "Software Intern",
  "imageUrl": "https://example.com/memories.jpg",
  "caption": "Graduation Day!",
  "likesCount": 0,
  "commentsCount": 0,
  "createdAt": "2026-07-01T15:20:00.000",
  "updatedAt": "2026-07-01T15:20:00.000"
}
```

---

### Fetch Memories Feed
Gets posts shared within the requesting user's academic community (Batch + Dept for CST/ECT, Batch + Dept + Section for others).

* **Endpoint**: `/api/posts/feed`
* **HTTP Method**: `GET`
* **Access Control**: Authenticated (Requires `Authorization: Bearer <JWT_token>` header)

#### Success Response
* **Status Code**: `200 OK`
* **Content-Type**: `application/json`
* **Body**: Array of Post objects.

---

### Fetch Post by ID
Retrieves details of a single post by its ID. Requires user to belong to the post creator's academic community.

* **Endpoint**: `/api/posts/{id}`
* **HTTP Method**: `GET`
* **Access Control**: Authenticated (Requires `Authorization: Bearer <JWT_token>` header)

#### Success Response
* **Status Code**: `200 OK`
* **Body**: Post object.

#### Error Response
* **Status Code**: `403 Forbidden`
* **Body**: Returned when requesting user is outside the creator's community.

---

## ❌ Error Responses

### Bad Request / Input Validation Failures
* **Status Code**: `400 Bad Request`
* **Body**: JSON array or message explaining validation error details (e.g. `Bio must not exceed 500 characters`).

### Unauthorized
* **Status Code**: `403 Forbidden`
* **Body**: Returned when JWT authorization header is missing, invalid, or expired.

### Server Error
* **Status Code**: `500 Internal Server Error`
* **Body**: Error message detail description.
