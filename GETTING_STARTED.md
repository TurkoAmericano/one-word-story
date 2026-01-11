# Getting Started with One Word Story

## Quick Start Guide

### 1. Prerequisites Check

Make sure you have installed:
- Node.js 18+ (`node --version`)
- npm (`npm --version`)
- Docker Desktop (must be running)

### 2. Start Docker Services

```bash
# Make sure Docker Desktop is running, then:
docker-compose up -d

# Verify containers are running:
docker-compose ps

# You should see:
# - one-word-story-db (PostgreSQL)
# - one-word-story-mail (MailHog)
```

### 3. Set Up Backend

```bash
cd backend

# Install dependencies
npm install

# Run database migrations
npm run migrate

# Start the development server
npm run dev
```

The backend will be running on http://localhost:3000

### 4. Set Up Frontend (in a new terminal)

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be running on http://localhost:5173

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Email Testing (MailHog)**: http://localhost:8025

## First-Time User Flow

1. **Register**: Go to http://localhost:5173 and click "Sign Up"
2. **Check Email**: Open http://localhost:8025 to see the verification email
3. **Verify Email**: Click the verification link in the email
4. **Create Story**: Click "Create New Story" from the dashboard
5. **Invite Friends**: Add email addresses to invite participants
6. **Play**: Take turns adding words to build a collaborative story!

## Testing the Email System

All emails sent by the application are captured by MailHog:
- Open http://localhost:8025 in your browser
- You'll see all verification emails and invitations
- Click on any email to view its content
- Click links in emails to test the full flow

## Common Issues

### Docker not running
**Error**: `Cannot connect to Docker daemon`
**Solution**: Start Docker Desktop application

### Port already in use
**Error**: `Port 5432 already in use`
**Solution**: Stop any PostgreSQL instance running locally, or change the port in docker-compose.yml

### Database connection failed
**Error**: `Connection refused to localhost:5432`
**Solution**:
```bash
# Check if PostgreSQL container is running
docker-compose ps

# Restart containers if needed
docker-compose down
docker-compose up -d
```

### Migration errors
**Error**: `relation "users" already exists`
**Solution**: This means migrations already ran. It's safe to ignore.

## Stopping the Application

```bash
# Stop backend: Ctrl+C in the backend terminal
# Stop frontend: Ctrl+C in the frontend terminal

# Stop Docker containers:
docker-compose down

# To also remove database data:
docker-compose down -v
```

## Development Workflow

### Making Backend Changes
1. Edit files in `backend/src/`
2. Server auto-restarts (nodemon)
3. Test with curl or the frontend

### Making Frontend Changes
1. Edit files in `frontend/src/`
2. Browser auto-refreshes (Vite HMR)
3. Changes appear instantly

### Database Changes
1. Create new migration file in `backend/migrations/`
2. Run `npm run migrate` in backend folder
3. Migration applies to database

## Environment Variables

Backend `.env` is already configured for local development. For production:
- Change `JWT_SECRET` to a secure random string
- Update `DATABASE_URL` for your production database
- Configure real SMTP settings (or use AWS SES)

## Next Steps

- Read the full project README.md for architecture details
- Check backend/README.md for API documentation
- Explore the codebase to understand the implementation
- Add features or customize the styling

## Need Help?

- Check backend logs in the terminal where you ran `npm run dev`
- Check frontend console in browser DevTools (F12)
- Check MailHog at http://localhost:8025 for email issues
- Verify database with: `docker exec -it one-word-story-db psql -U devuser -d one_word_story`

Happy storytelling!
