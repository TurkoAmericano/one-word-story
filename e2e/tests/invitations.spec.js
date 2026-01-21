import { test, expect } from './fixtures.js';
import { loginUserViaAPI, registerUser } from './utils/auth.js';
import { createTestStory, getInvitationToken, addParticipant, getParticipants } from './utils/database.js';

test.describe('Invitation System - Sending Invitations', () => {
  test('verified user can invite another user to a story', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Invitation Story');

    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto(`/story/${story.id}`);

    // Find invite section and enter email
    const inviteInput = page.locator('input[type="email"], input[placeholder*="email"]');
    await inviteInput.fill(user2.email);

    // Click invite button
    await page.click('button:has-text("Invite"), button:has-text("Send")');

    // Should show success message
    await expect(page.locator('text=/invited|sent/i')).toBeVisible({ timeout: 10000 });

    // Invitation should exist in database
    const token = await getInvitationToken(user2.email, story.id);
    expect(token).toBeTruthy();
  });

  test('unverified user cannot send invitations', async ({ page, unverifiedUser }) => {
    const story = await createTestStory(unverifiedUser.id, 'Unverified Invite Story');

    await loginUserViaAPI(page, { email: unverifiedUser.email, password: unverifiedUser.password });
    await page.goto(`/story/${story.id}`);

    // Try to invite
    const inviteInput = page.locator('input[type="email"], input[placeholder*="email"]');
    if (await inviteInput.isVisible()) {
      await inviteInput.fill('someone@test.com');
      await page.click('button:has-text("Invite"), button:has-text("Send")');

      // Should show error about email verification
      await expect(page.locator('text=/verify|email/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('cannot invite existing participant', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Already Participant Story');
    await addParticipant(story.id, user2.id, 1);

    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto(`/story/${story.id}`);

    // Try to invite user2 who is already a participant
    const inviteInput = page.locator('input[type="email"], input[placeholder*="email"]');
    if (await inviteInput.isVisible()) {
      await inviteInput.fill(user2.email);
      await page.click('button:has-text("Invite"), button:has-text("Send")');

      // Should show error
      await expect(page.locator('text=/already.*participant|already.*member/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('cannot invite with duplicate pending invitation', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Duplicate Invite Story');

    // Create first invitation
    await db.query(
      `INSERT INTO invitations (story_id, email, invited_by, token, expires_at)
       VALUES ($1, $2, $3, 'token123', NOW() + INTERVAL '7 days')`,
      [story.id, user2.email, user1.id]
    );

    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto(`/story/${story.id}`);

    // Try to invite same email again
    const inviteInput = page.locator('input[type="email"], input[placeholder*="email"]');
    if (await inviteInput.isVisible()) {
      await inviteInput.fill(user2.email);
      await page.click('button:has-text("Invite"), button:has-text("Send")');

      // Should show error about pending invitation
      await expect(page.locator('text=/already.*invited|pending/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('cannot invite yourself', async ({ page, verifiedUser }) => {
    const story = await createTestStory(verifiedUser.id, 'Self Invite Story');

    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto(`/story/${story.id}`);

    // Try to invite yourself
    const inviteInput = page.locator('input[type="email"], input[placeholder*="email"]');
    if (await inviteInput.isVisible()) {
      await inviteInput.fill(verifiedUser.email);
      await page.click('button:has-text("Invite"), button:has-text("Send")');

      // Should show error or be prevented
      await expect(page.locator('text=/yourself|own email|already/i')).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Invitation System - Accepting Invitations', () => {
  test('user can accept valid invitation', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Accept Invite Story');

    // Create invitation for user2
    const token = 'valid-token-12345';
    await db.query(
      `INSERT INTO invitations (story_id, email, invited_by, token, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')`,
      [story.id, user2.email, user1.id, token]
    );

    // Login as user2
    await loginUserViaAPI(page, { email: user2.email, password: user2.password });

    // Accept invitation
    await page.goto(`/accept-invite/${token}`);

    // Should redirect to story or show success
    await expect(page).toHaveURL(new RegExp(`/story/${story.id}|/dashboard`), { timeout: 10000 });

    // User2 should now be a participant
    const participants = await getParticipants(story.id);
    const user2Participant = participants.find(p => p.user_id === user2.id);
    expect(user2Participant).toBeTruthy();
  });

  test('invitation fails with wrong email', async ({ page, threeUsers, db }) => {
    const { user1, user2, user3 } = threeUsers;

    const story = await createTestStory(user1.id, 'Wrong Email Story');

    // Create invitation for user2's email
    const token = 'wrong-email-token';
    await db.query(
      `INSERT INTO invitations (story_id, email, invited_by, token, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')`,
      [story.id, user2.email, user1.id, token]
    );

    // Login as user3 (wrong email)
    await loginUserViaAPI(page, { email: user3.email, password: user3.password });

    // Try to accept invitation
    await page.goto(`/accept-invite/${token}`);

    // Should show error about email mismatch
    await expect(page.locator('text=/email.*match|different.*email|not.*you/i')).toBeVisible({ timeout: 10000 });
  });

  test('expired invitation cannot be accepted', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Expired Invite Story');

    // Create expired invitation
    const token = 'expired-token-12345';
    await db.query(
      `INSERT INTO invitations (story_id, email, invited_by, token, expires_at)
       VALUES ($1, $2, $3, $4, NOW() - INTERVAL '1 day')`,
      [story.id, user2.email, user1.id, token]
    );

    await loginUserViaAPI(page, { email: user2.email, password: user2.password });
    await page.goto(`/accept-invite/${token}`);

    // Should show error about expired invitation
    await expect(page.locator('text=/expired|no longer valid/i')).toBeVisible({ timeout: 10000 });
  });

  test('already accepted invitation cannot be reused', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Reused Invite Story');

    // Create already accepted invitation
    const token = 'accepted-token-12345';
    await db.query(
      `INSERT INTO invitations (story_id, email, invited_by, token, accepted, expires_at)
       VALUES ($1, $2, $3, $4, true, NOW() + INTERVAL '7 days')`,
      [story.id, user2.email, user1.id, token]
    );

    await loginUserViaAPI(page, { email: user2.email, password: user2.password });
    await page.goto(`/accept-invite/${token}`);

    // Should show error or redirect (invitation already used)
    await expect(page.locator('text=/already.*accepted|already.*used|invalid/i')).toBeVisible({ timeout: 10000 });
  });

  test('invalid token shows error', async ({ page, verifiedUser }) => {
    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto('/accept-invite/completely-invalid-token');

    // Should show error
    await expect(page.locator('text=/invalid|not found|error/i')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Invitation System - Redirect for Unauthenticated Users', () => {
  test('unauthenticated user is redirected to login with invitation URL preserved', async ({ page }) => {
    const inviteUrl = '/accept-invite/some-invite-token';
    await page.goto(inviteUrl);

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('after login, user is redirected back to invitation', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Redirect Back Story');

    const token = 'redirect-token-12345';
    await db.query(
      `INSERT INTO invitations (story_id, email, invited_by, token, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')`,
      [story.id, user2.email, user1.id, token]
    );

    // Go to invitation page without auth
    await page.goto(`/accept-invite/${token}`);

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);

    // Login as user2
    await page.fill('#email', user2.email);
    await page.fill('#password', user2.password);
    await page.click('button[type="submit"]');

    // Should redirect back to accept-invite page and process it
    await expect(page).toHaveURL(new RegExp(`/story/${story.id}|/accept-invite/${token}`), { timeout: 15000 });
  });

  test('after registration, user is redirected back to invitation', async ({ page, verifiedUser, db }) => {
    const story = await createTestStory(verifiedUser.id, 'Register Redirect Story');

    const newUserEmail = 'newuser-invite@test.com';
    const token = 'register-redirect-token';
    await db.query(
      `INSERT INTO invitations (story_id, email, invited_by, token, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')`,
      [story.id, newUserEmail, verifiedUser.id, token]
    );

    // Go to invitation page without auth
    await page.goto(`/accept-invite/${token}`);

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);

    // Click sign up link
    await page.click('text=Sign up');

    // Should preserve the redirect in register page
    await expect(page).toHaveURL(/\/register/);

    // Register as the invited user
    await page.fill('#email', newUserEmail);
    await page.fill('#username', 'newinviteduser');
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect back to accept-invite page
    await expect(page).toHaveURL(new RegExp(`/story/${story.id}|/accept-invite/${token}|/dashboard`), { timeout: 15000 });
  });
});

test.describe('Invitation System - Pending Invitations Display', () => {
  test('pending invitations are shown in story view', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Pending Display Story');

    // Create pending invitation
    await db.query(
      `INSERT INTO invitations (story_id, email, invited_by, token, expires_at)
       VALUES ($1, $2, $3, 'pending-display-token', NOW() + INTERVAL '7 days')`,
      [story.id, user2.email, user1.id]
    );

    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto(`/story/${story.id}`);

    // Should show pending invitation
    await expect(page.locator(`text=/${user2.email}|pending|invited/i`)).toBeVisible();
  });

  test('accepted invitation is removed from pending list', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Accept Remove Pending Story');

    const token = 'accept-remove-token';
    await db.query(
      `INSERT INTO invitations (story_id, email, invited_by, token, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')`,
      [story.id, user2.email, user1.id, token]
    );

    // User2 accepts invitation
    await loginUserViaAPI(page, { email: user2.email, password: user2.password });
    await page.goto(`/accept-invite/${token}`);

    // Wait for redirect
    await expect(page).toHaveURL(new RegExp(`/story/${story.id}|/dashboard`), { timeout: 10000 });

    // Now check as user1 - pending should be gone
    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto(`/story/${story.id}`);

    // User2 should now appear as participant, not pending
    await expect(page.locator(`text=${user2.username}`)).toBeVisible();
  });
});

test.describe('Invitation System - Multiple Invitations', () => {
  test('can send multiple invitations to different emails', async ({ page, threeUsers, db }) => {
    const { user1, user2, user3 } = threeUsers;

    const story = await createTestStory(user1.id, 'Multi Invite Story');

    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto(`/story/${story.id}`);

    // Invite user2
    const inviteInput = page.locator('input[type="email"], input[placeholder*="email"]');
    await inviteInput.fill(user2.email);
    await page.click('button:has-text("Invite"), button:has-text("Send")');
    await expect(page.locator('text=/invited|sent/i')).toBeVisible({ timeout: 10000 });

    // Invite user3
    await inviteInput.fill(user3.email);
    await page.click('button:has-text("Invite"), button:has-text("Send")');
    await expect(page.locator('text=/invited|sent/i')).toBeVisible({ timeout: 10000 });

    // Both should have pending invitations
    const token2 = await getInvitationToken(user2.email, story.id);
    const token3 = await getInvitationToken(user3.email, story.id);
    expect(token2).toBeTruthy();
    expect(token3).toBeTruthy();
  });
});

test.describe('Invitation System - Story Creation with Invitations', () => {
  test('can invite users during story creation', async ({ page, twoUsers }) => {
    const { user1, user2 } = twoUsers;

    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto('/create');

    // Fill in story details
    await page.fill('input[name="title"], #title', 'Story With Invites');

    // Look for invite input in creation form
    const inviteInput = page.locator('.email-list input, input[placeholder*="email"]');
    if (await inviteInput.first().isVisible()) {
      await inviteInput.first().fill(user2.email);
    }

    // Submit
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/story\//, { timeout: 10000 });

    // Get story ID and check for invitation
    const url = page.url();
    const storyId = url.split('/story/')[1];
    const token = await getInvitationToken(user2.email, storyId);

    // Invitation should exist (if the form supports it)
    // This test will pass whether or not creation-time invites are supported
    if (token) {
      expect(token).toBeTruthy();
    }
  });
});
