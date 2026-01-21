import { test as base } from '@playwright/test';
import { cleanDatabase, createTestUser, closePool, getPool } from './utils/database.js';

// Extend base test with our fixtures
export const test = base.extend({
  // Clean database before each test
  cleanDb: [async ({}, use) => {
    await cleanDatabase();
    await use();
  }, { auto: true }],

  // Create a verified user
  verifiedUser: async ({}, use) => {
    const user = await createTestUser({
      email: 'verified@test.com',
      username: 'verifieduser',
      password: 'password123',
      emailVerified: true,
    });
    await use({ ...user, password: 'password123' });
  },

  // Create an unverified user
  unverifiedUser: async ({}, use) => {
    const user = await createTestUser({
      email: 'unverified@test.com',
      username: 'unverifieduser',
      password: 'password123',
      emailVerified: false,
    });
    await use({ ...user, password: 'password123' });
  },

  // Create an admin user (requires VITE_ADMIN_EMAIL env var match)
  adminUser: async ({}, use) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@test.com';
    const user = await createTestUser({
      email: adminEmail,
      username: 'adminuser',
      password: 'adminpass123',
      emailVerified: true,
    });
    await use({ ...user, password: 'adminpass123' });
  },

  // Create two verified users for multiplayer tests
  twoUsers: async ({}, use) => {
    const user1 = await createTestUser({
      email: 'user1@test.com',
      username: 'userone',
      password: 'password123',
      emailVerified: true,
    });
    const user2 = await createTestUser({
      email: 'user2@test.com',
      username: 'usertwo',
      password: 'password123',
      emailVerified: true,
    });
    await use({
      user1: { ...user1, password: 'password123' },
      user2: { ...user2, password: 'password123' },
    });
  },

  // Create three users for more complex turn tests
  threeUsers: async ({}, use) => {
    const user1 = await createTestUser({
      email: 'player1@test.com',
      username: 'playerone',
      password: 'password123',
      emailVerified: true,
    });
    const user2 = await createTestUser({
      email: 'player2@test.com',
      username: 'playertwo',
      password: 'password123',
      emailVerified: true,
    });
    const user3 = await createTestUser({
      email: 'player3@test.com',
      username: 'playerthree',
      password: 'password123',
      emailVerified: true,
    });
    await use({
      user1: { ...user1, password: 'password123' },
      user2: { ...user2, password: 'password123' },
      user3: { ...user3, password: 'password123' },
    });
  },

  // Database pool for direct queries
  db: async ({}, use) => {
    const pool = getPool();
    await use(pool);
  },
});

export { expect } from '@playwright/test';

// Cleanup after all tests
test.afterAll(async () => {
  await closePool();
});
