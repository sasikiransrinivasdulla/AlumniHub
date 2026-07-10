# REST API Reference Documentation

All endpoints require JWT Bearer Authentication unless marked as **Public**. Set the header `Authorization: Bearer <JWT_token>` for authenticated requests.

---

## 🔐 Authentication

### POST `/api/auth/google`
Verifies a Firebase ID token, registers new users, and returns an Alumni Hub JWT.
* **Access Control**: Public
* **Request**:
  ```json
  {
    "firebaseToken": "eyJhbGciOiJSUzI1NiIs..."
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "email": "user@gmail.com",
      "fullName": "John Doe",
      "profileCompleted": false,
      "role": "USER"
    },
    "authStatus": "PENDING_ONBOARDING"
  }
  ```

---

## 👤 User Profiles

### GET `/api/user/me`
Retrieves the authenticated user's profile details.
* **Response (200 OK)**: Mapped `UserDto` object.

### PUT `/api/user/me`
Updates user details during onboarding or edit profile.
* **Request**:
  ```json
  {
    "fullName": "John Doe",
    "batch": "2022",
    "department": "CSE",
    "section": "A",
    "bio": "Software developer",
    "skills": "Java,React"
  }
  ```
* **Response (200 OK)**: Updated `UserDto` object.

---

## 🎓 Alumni Directory

### GET `/api/alumni`
Fetches directory of classmates visible to the requester based on privacy settings.
* **Response (200 OK)**: List of `UserDto` objects.

### GET `/api/alumni/search`
Queries directory with matching parameters.
* **Query Parameters**: `q`, `company`, `position`, `batch`, `department`, `section`, `city`, `skills`, `openTo`, `badge`
* **Response (200 OK)**: List of matching `UserDto` objects.

### GET `/api/alumni/recommendations`
Fetches a list of recommended classmates ("People You May Know").
* **Response (200 OK)**: List of up to 12 `UserDto` objects.

### GET `/api/alumni/{id}`
Retrieves specific profile details. Returns `403 Forbidden` if blocked by privacy config.
* **Response (200 OK)**: Detailed `UserDto` object.

---

## 🔒 Connections (In-Touch)

### POST `/api/in-touch/request/{targetUserId}`
Dispatches a connection request.
* **Response (200 OK)**: `{"success": true}`

### POST `/api/in-touch/accept/{requesterUserId}`
Approves a connection request.
* **Response (200 OK)**: `{"success": true}`

### POST `/api/in-touch/reject/{requesterUserId}`
Declines a connection request.
* **Response (200 OK)**: `{"success": true}`

### DELETE `/api/in-touch/remove/{userId}`
Disconnects an active connection.
* **Response (200 OK)**: `{"success": true}`

---

## 📞 Contact Details Sharing

### POST `/api/contact-requests/request/{ownerUserId}`
Requests a user's mobile number.
* **Response (200 OK)**: empty response.

### POST `/api/contact-requests/accept/{requesterUserId}`
Approves request to view contact number.
* **Response (200 OK)**: empty response.

---

## 💬 Conversations & Direct Messages

### POST `/api/chat/conversations?targetUserId={userId}`
Gets or creates a message room with another user.
* **Response (200 OK)**: `ConversationDto` details.

### GET `/api/chat/conversations/{id}`
Fetches details of a specific conversation room by ID.
* **Response (200 OK)**: `ConversationDto` details.

### GET `/api/chat/conversations/{id}/messages`
Loads messages inside a room (paginated).
* **Response (200 OK)**: Page wrapper of `MessageDto`.

### POST `/api/chat/conversations/{id}/messages`
Sends a message.
* **Request**:
  ```json
  {
    "text": "Hello!",
    "imageUrl": null
  }
  ```
* **Response (200 OK)**: `MessageDto` object.

---

## 📅 Events Module

### POST `/api/events`
Creates a webinar, hackathon, or meetup.
* **Request**:
  ```json
  {
    "title": "Alumni Meetup 2026",
    "description": "Tech conference...",
    "startDate": "2026-08-01T10:00:00",
    "endDate": "2026-08-01T18:00:00",
    "capacity": 100,
    "online": true,
    "meetingLink": "https://zoom.us/j/..."
  }
  ```
* **Response (200 OK)**: `EventDto` object.

### POST `/api/events/{id}/rsvp`
Registers user as an event participant.
* **Response (200 OK)**: Updated `EventDto` object.
