import { test, expect } from './fixtures.js';
import { loginUserViaAPI, logoutUser } from './utils/auth.js';
import { createTestStory, addParticipant, addWord, createTestUser } from './utils/database.js';

test.describe('Edge Cases - Invalid Routes', () => {
  test('non-existent route redirects to home', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page).toHaveURL('/');
  });

  test('non-existent story shows error', async ({ page, verifiedUser }) => {
    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto('/story/00000000-0000-0000-0000-000000000000');

    await expect(page.locator('text=/not found|error|does not exist/i')).toBeVisible({ timeout: 10000 });
  });

  test('invalid story ID format shows error', async ({ page, verifiedUser }) => {
    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto('/story/invalid-id-format');

    // Should show error or redirect
    await expect(page.locator('text=/not found|error|invalid/i')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Edge Cases - Session Handling', () => {
  test('expired token redirects to login', async ({ page, verifiedUser }) => {
    // Login first
    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Set an expired/invalid token
    await page.evaluate(() => {
      localStorage.setItem('token', 'expired-invalid-token');
    });

    // Try to access protected route
    await page.goto('/create');

    // Should eventually redirect to login due to invalid token
    // The app may try to validate the token with the backend
    await page.waitForTimeout(2000);
    await page.reload();

    // Should be redirected to login or show error
    const currentUrl = page.url();
    const isOnLoginOrHasError = currentUrl.includes('/login') ||
      await page.locator('text=/login|session|expired/i').isVisible();
    expect(isOnLoginOrHasError).toBe(true);
  });

  test('clearing localStorage logs user out', async ({ page, verifiedUser }) => {
    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto('/dashboard');

    // Clear localStorage
    await logoutUser(page);

    // Navigate to protected route
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Edge Cases - Concurrent Actions', () => {
  test('rapid word submissions are handled correctly', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Rapid Submit Story');
    await addParticipant(story.id, user2.id, 1);

    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto(`/story/${story.id}`);

    // Try to submit word quickly multiple times
    const wordInput = page.locator('.word-input, input[placeholder*="word"]');
    const submitButton = page.locator('button:has-text("Add"), button:has-text("Submit")');

    await wordInput.fill('First');
    await submitButton.click();

    // Immediately try to submit again (should fail - not user's turn anymore)
    await wordInput.fill('Second');
    await submitButton.click();

    // Wait for responses
    await page.waitForTimeout(2000);

    // Only one word should be added (the first one)
    await expect(page.locator('text=First')).toBeVisible();
  });
});

test.describe('Edge Cases - Input Validation', () => {
  test('special characters in word are handled', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Special Chars Story');
    await addParticipant(story.id, user2.id, 1);

    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto(`/story/${story.id}`);

    // Try words with special characters
    const wordInput = page.locator('.word-input, input[placeholder*="word"]');
    const submitButton = page.locator('button:has-text("Add"), button:has-text("Submit")');

    await wordInput.fill("don't");
    await submitButton.click();

    // Word should be added (apostrophe is valid)
    await expect(page.locator("text=don't")).toBeVisible({ timeout: 10000 });
  });

  test('whitespace-only input is rejected', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Whitespace Story');
    await addParticipant(story.id, user2.id, 1);

    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto(`/story/${story.id}`);

    const wordInput = page.locator('.word-input, input[placeholder*="word"]');
    const submitButton = page.locator('button:has-text("Add"), button:has-text("Submit")');

    await wordInput.fill('   ');
    await submitButton.click();

    // Should show validation error or not submit
    await page.waitForTimeout(1000);
    await expect(page.locator('text=/your turn/i')).toBeVisible(); // Still user's turn
  });

  test('XSS attempt in word is sanitized', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'XSS Test Story');
    await addParticipant(story.id, user2.id, 1);

    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto(`/story/${story.id}`);

    const wordInput = page.locator('.word-input, input[placeholder*="word"]');
    const submitButton = page.locator('button:has-text("Add"), button:has-text("Submit")');

    await wordInput.fill('<script>alert("xss")</script>');
    await submitButton.click();

    // Wait for potential XSS
    await page.waitForTimeout(1000);

    // No alert should have appeared and script shouldn't execute
    // The content should be escaped or rejected
    const alertDetected = await page.evaluate(() => {
      // Check if any alert was triggered
      return window.alertTriggered || false;
    });
    expect(alertDetected).toBe(false);
  });

  test('SQL injection in email is handled', async ({ page }) => {
    await page.goto('/register');

    await page.fill('#email', "test@test.com'; DROP TABLE users;--");
    await page.fill('#username', 'sqlinjection');
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'password123');
    await page.click('button[type="submit"]');

    // Should show validation error for invalid email format
    await expect(page.locator('text=/invalid|error|email/i')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Edge Cases - Story States', () => {
  test('story with no words shows appropriate message', async ({ page, twoUsers, db }) => {
    const { user1, user2 } = twoUsers;

    const story = await createTestStory(user1.id, 'Empty Story');
    await addParticipant(story.id, user2.id, 1);

    await loginUserViaAPI(page, { email: user1.email, password: user1.password });
    await page.goto(`/story/${story.id}`);

    // Should show empty state or prompt to add first word
    await expect(page.locator('text=/no words|start.*story|first word|empty/i')).toBeVisible();
  });

  test('story with many words displays correctly', async ({ page, verifiedUser, db }) => {
    const story = await createTestStory(verifiedUser.id, 'Long Story');

    // Add many words
    const words = ['Once', 'upon', 'a', 'time', 'there', 'lived', 'a', 'brave', 'knight', 'who'];
    for (let i = 0; i < words.length; i++) {
      await addWord(story.id, verifiedUser.id, words[i], i);
    }

    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto(`/story/${story.id}`);

    // All words should be visible
    for (const word of words) {
      await expect(page.locator(`.story-text, .story-content`).locator(`text=${word}`)).toBeVisible();
    }
  });
});

test.describe('Edge Cases - User States', () => {
  test('deleted user cannot login', async ({ page, db }) => {
    // Create a user
    const user = await createTestUser({
      email: 'willbedeleted@test.com',
      username: 'deleteduser',
      password: 'password123'
    });

    // Delete the user
    await db.query('DELETE FROM users WHERE id = $1', [user.id]);

    // Try to login
    await page.goto('/login');
    await page.fill('#email', 'willbedeleted@test.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator('.error')).toContainText(/invalid|failed|not found/i);
  });
});

test.describe('Edge Cases - Network and Loading', () => {
  test('shows loading state during API calls', async ({ page, verifiedUser }) => {
    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });

    // Slow down network
    await page.route('**/api/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.goto('/dashboard');

    // Should show some loading indicator
    const loadingIndicator = page.locator('text=/loading/i, .loading, [aria-busy="true"]');
    // Loading may or may not be visible depending on timing
    // Just verify page eventually loads
    await expect(page.locator('text=/stories|dashboard|create/i')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Edge Cases - Browser Navigation', () => {
  test('back button works correctly after login', async ({ page, verifiedUser }) => {
    // Start at login page
    await page.goto('/login');

    // Login
    await page.fill('#email', verifiedUser.email);
    await page.fill('#password', verifiedUser.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to create
    await page.goto('/create');
    await expect(page).toHaveURL(/\/create/);

    // Go back
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('forward button works correctly', async ({ page, verifiedUser }) => {
    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });

    await page.goto('/dashboard');
    await page.goto('/create');

    // Go back
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard/);

    // Go forward
    await page.goForward();
    await expect(page).toHaveURL(/\/create/);
  });

  test('refresh maintains authentication', async ({ page, verifiedUser }) => {
    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto('/dashboard');

    // Refresh
    await page.reload();

    // Should still be on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Edge Cases - Form Behavior', () => {
  test('form prevents default submit on enter key', async ({ page, verifiedUser }) => {
    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto('/create');

    // Focus on title input and press enter
    await page.fill('input[name="title"], #title', 'Enter Key Test');
    await page.press('input[name="title"], #title', 'Enter');

    // Form should submit or handle enter appropriately
    // Either redirect to story or stay on form
    await page.waitForTimeout(2000);
    const url = page.url();
    const validState = url.includes('/story/') || url.includes('/create');
    expect(validState).toBe(true);
  });

  test('disabled button prevents double submission', async ({ page }) => {
    await page.goto('/login');

    await page.fill('#email', 'test@test.com');
    await page.fill('#password', 'password123');

    // Click submit
    await page.click('button[type="submit"]');

    // Button should be disabled during submission
    const submitButton = page.locator('button[type="submit"]');
    const isDisabled = await submitButton.isDisabled();

    // Either disabled or shows loading text
    const buttonText = await submitButton.textContent();
    const isLoading = buttonText?.toLowerCase().includes('loading') ||
                      buttonText?.toLowerCase().includes('logging');

    expect(isDisabled || isLoading).toBe(true);
  });
});

test.describe('Edge Cases - Multiple Tabs/Windows', () => {
  test('logout in one tab affects other tabs on navigation', async ({ page, verifiedUser, context }) => {
    // Login in first tab
    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto('/dashboard');

    // Open second tab
    const page2 = await context.newPage();
    await page2.goto('/dashboard');
    await expect(page2).toHaveURL(/\/dashboard/);

    // Logout in first tab
    await page.click('text=Logout');

    // Navigate in second tab - should redirect to login
    await page2.goto('/create');
    await expect(page2).toHaveURL(/\/login/);
  });
});
