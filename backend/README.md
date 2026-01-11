# One Word Story - Backend API

RESTful API for the One Word Story collaborative storytelling application.

## Tech Stack

- Node.js + Express
- PostgreSQL
- JWT Authentication
- Nodemailer (email)
- bcryptjs (password hashing)

## API Endpoints

### Authentication

#### POST /api/auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "emailVerified": false
  }
}
```

#### POST /api/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "emailVerified": true
  }
}
```

#### GET /api/auth/verify/:token
Verify email address with token from email.

**Response:**
```json
{
  "message": "Email verified successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "emailVerified": true
  }
}
```

#### GET /api/auth/me
Get current user info (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

### Stories

All story endpoints require authentication via Bearer token.

#### GET /api/stories
Get all stories for the current user.

**Response:**
```json
{
  "stories": [
    {
      "id": "uuid",
      "title": "Adventure Time",
      "isEnded": false,
      "createdBy": {
        "id": "uuid",
        "username": "johndoe"
      },
      "wordCount": 15,
      "participantCount": 3,
      "currentTurn": 2,
      "isYourTurn": false,
      "createdAt": "2024-01-08T12:00:00Z"
    }
  ]
}
```

#### GET /api/stories/:id
Get detailed story information.

**Response:**
```json
{
  "story": {
    "id": "uuid",
    "title": "Adventure Time",
    "isEnded": false,
    "words": [
      {
        "id": "uuid",
        "word": "Once",
        "position": 0,
        "addedBy": {
          "id": "uuid",
          "username": "johndoe"
        },
        "createdAt": "2024-01-08T12:00:00Z"
      }
    ],
    "participants": [
      {
        "id": "uuid",
        "username": "johndoe",
        "turnOrder": 0,
        "joinedAt": "2024-01-08T12:00:00Z"
      }
    ],
    "currentTurn": 1,
    "isYourTurn": false
  }
}
```

#### POST /api/stories
Create a new story (requires email verification).

**Request:**
```json
{
  "title": "Adventure Time",
  "initialWord": "Once"
}
```

Both fields are optional.

#### POST /api/stories/:id/words
Add a word to a story.

**Request:**
```json
{
  "word": "upon"
}
```

**Validation:**
- Must be your turn
- Story must not be ended
- Word must be 1-50 characters
- Only letters, hyphens, and apostrophes allowed

#### POST /api/stories/:id/end
End a story (must be your turn).

#### DELETE /api/stories/:id
Delete a story (creator only).

### Invitations

#### POST /api/invitations
Invite users to a story (requires email verification).

**Request:**
```json
{
  "storyId": "uuid",
  "emails": ["friend1@example.com", "friend2@example.com"]
}
```

**Response:**
```json
{
  "message": "2 invitation(s) sent successfully",
  "invitations": [
    {
      "id": "uuid",
      "email": "friend1@example.com",
      "createdAt": "2024-01-08T12:00:00Z",
      "expiresAt": "2024-01-15T12:00:00Z"
    }
  ]
}
```

#### GET /api/invitations/:token
Accept an invitation.

**Response:**
```json
{
  "message": "Successfully joined the story",
  "story": {
    "id": "uuid",
    "title": "Adventure Time"
  }
}
```

#### GET /api/invitations/stories/:id/participants
Get all participants in a story.

#### GET /api/invitations/stories/:id/pending
Get pending invitations for a story.

## Error Handling

All errors return JSON in this format:

```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad request (validation error)
- 401: Unauthorized (no token or invalid token)
- 403: Forbidden (e.g., not your turn, email not verified)
- 404: Not found
- 409: Conflict (e.g., email already registered)
- 500: Internal server error

## Rate Limiting

Default limits (configurable via .env):
- Window: 15 minutes
- Max requests: 100 per window

## Development

### Running Tests
```bash
npm test
```

### Database Migrations
```bash
# Run all pending migrations
npm run migrate

# Create a new migration
# Add a .sql file to migrations/ folder
# Name format: 002_description.sql
```

### Database Access
```bash
# Connect to PostgreSQL
docker exec -it one-word-story-db psql -U devuser -d one_word_story

# Common queries
SELECT * FROM users;
SELECT * FROM stories;
SELECT * FROM story_words ORDER BY word_position;
```

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- SQL injection prevention (parameterized queries)
- Rate limiting
- CORS configuration
- Helmet security headers
- Email verification requirement

## Business Logic

### Turn Management
- Turns rotate based on `turn_order` field
- Current turn = `word_count % participant_count`
- Only the current turn holder can add words
- Turn order is assigned when participants join

### Story Completion
- Any participant can end the story on their turn
- Once ended, no more words can be added
- Story remains viewable by all participants

### Invitations
- Tokens expire after 7 days
- One-time use only
- Email must match invitation recipient
- Cannot invite existing participants
