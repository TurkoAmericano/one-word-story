# One Word Story

A collaborative storytelling web application where players take turns adding one word to a shared story.

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose

## Getting Started

### 1. Start the database and email server

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on `localhost:5432`
- MailHog (email testing) on `localhost:8025` (web UI) and `localhost:1025` (SMTP)

### 2. Set up the backend

```bash
cd backend
npm install
npm run migrate  # Run database migrations
npm run dev      # Start development server
```

Backend will run on `http://localhost:3000`

### 3. Set up the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. View test emails

Open `http://localhost:8025` in your browser to see all emails sent by the application (invitations, verifications, etc.)

## Project Structure

```
.
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── config/   # Database and app configuration
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Authentication, validation
│   │   ├── models/       # Database models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── utils/        # Helper functions
│   └── migrations/   # Database migrations
├── frontend/         # React + Vite SPA
└── docker-compose.yml
```

## Environment Variables

### Backend (.env)

```
DATABASE_URL=postgresql://devuser:devpassword@localhost:5432/one_word_story
JWT_SECRET=your-secret-key-change-in-production
PORT=3000
SMTP_HOST=localhost
SMTP_PORT=1025
FROM_EMAIL=noreply@onewordstory.local
FRONTEND_URL=http://localhost:5173
```

## API Documentation

See `/backend/README.md` for detailed API endpoint documentation.

## Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Development Notes

- The app uses JWT tokens for authentication
- Email verification is required before creating stories
- Turn order is managed automatically
- MailHog captures all outgoing emails in development
