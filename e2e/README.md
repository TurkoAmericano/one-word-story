# End-to-End Tests

This directory contains comprehensive end-to-end tests for the One Word Story application using Playwright.

## Prerequisites

- Node.js 18+
- PostgreSQL database running locally
- Backend and frontend services

## Setup

1. Install dependencies:
```bash
cd e2e
npm install
npx playwright install chromium
```

2. Set up environment variables (create `.env` file in `e2e/` or set in terminal):
```bash
# Database connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=one_word_story
DB_USER=postgres
DB_PASSWORD=postgres

# API URL
API_URL=http://localhost:3000

# Frontend URL
BASE_URL=http://localhost:5173

# Admin email (for admin tests)
ADMIN_EMAIL=admin@test.com
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests with browser visible
```bash
npm run test:headed
```

### Run tests with Playwright UI
```bash
npm run test:ui
```

### Debug tests
```bash
npm run test:debug
```

### View test report
```bash
npm run report
```

## Test Structure

```
e2e/
├── playwright.config.js    # Playwright configuration
├── package.json
├── tests/
│   ├── fixtures.js         # Test fixtures and setup
│   ├── utils/
│   │   ├── database.js     # Database utilities
│   │   └── auth.js         # Authentication utilities
│   ├── auth.spec.js        # Authentication tests
│   ├── story-management.spec.js  # Story CRUD tests
│   ├── turn-gameplay.spec.js     # Turn-based gameplay tests
│   ├── invitations.spec.js       # Invitation system tests
│   ├── admin.spec.js             # Admin functionality tests
│   └── edge-cases.spec.js        # Edge cases and error handling
```

## Test Categories

### Authentication Tests (`auth.spec.js`)
- User registration with validation
- Login with valid/invalid credentials
- Email verification flow
- Password visibility toggle
- Protected route access
- Session persistence
- Logout functionality

### Story Management Tests (`story-management.spec.js`)
- Story creation (with/without first word)
- Dashboard display and categorization
- Story viewing and permissions
- Story deletion
- Ended story states

### Turn-Based Gameplay Tests (`turn-gameplay.spec.js`)
- Turn rotation with 2 and 3 participants
- Adding words on your turn
- Blocking actions when not your turn
- Single participant restrictions
- Word validation
- Ending stories
- Turn indicator display

### Invitation Tests (`invitations.spec.js`)
- Sending invitations
- Accepting invitations
- Expired/invalid invitation handling
- Email mismatch detection
- Redirect preservation for unauthenticated users
- Pending invitation display

### Admin Tests (`admin.spec.js`)
- Admin access control
- User list display
- User deletion
- Verification email resend
- Admin navigation

### Edge Cases Tests (`edge-cases.spec.js`)
- Invalid routes and IDs
- Session expiration
- Concurrent actions
- Input validation (XSS, SQL injection)
- Browser navigation (back/forward)
- Multiple tabs
- Network/loading states

## Writing New Tests

Use the provided fixtures for common setup:

```javascript
import { test, expect } from './fixtures.js';

test('my test', async ({ page, verifiedUser }) => {
  // verifiedUser is a pre-created user with verified email
  await loginUserViaAPI(page, {
    email: verifiedUser.email,
    password: verifiedUser.password
  });
  // ... test code
});
```

Available fixtures:
- `cleanDb` - Cleans database before each test (auto-applied)
- `verifiedUser` - A user with verified email
- `unverifiedUser` - A user without verified email
- `adminUser` - An admin user
- `twoUsers` - Two verified users for multiplayer tests
- `threeUsers` - Three verified users for complex turn tests
- `db` - Direct database pool access

## Notes

- Tests run serially to avoid database conflicts
- Each test starts with a clean database
- The test configuration auto-starts backend and frontend services
- Screenshots and videos are captured on failure
