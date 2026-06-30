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

## ❌ Error Responses

### Bad Request
* **Status Code**: `400 Bad Request`
* **Body**: Text describing the validation failure (e.g. `Firebase token does not contain an email address`).

### Unauthorized / Server Error
* **Status Code**: `500 Internal Server Error`
* **Body**: `Authentication failed: <details of exception>` (occurs if the token is expired, has an invalid signature, or is forged).
