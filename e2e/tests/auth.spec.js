import { test, expect } from './fixtures.js';
import { loginUser, registerUser, logoutUser, loginUserViaAPI } from './utils/auth.js';
import { getUser, getVerificationToken } from './utils/database.js';

test.describe('Authentication - Registration', () => {
  test('should register a new user successfully', async ({ page }) => {
    await page.goto('/register');

    await page.fill('#email', 'newuser@test.com');
    await page.fill('#username', 'newuser');
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard after registration
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // User should exist in database
    const user = await getUser('newuser@test.com');
    expect(user).toBeTruthy();
    expect(user.username).toBe('newuser');
    expect(user.email_verified).toBe(false);
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await page.goto('/register');

    await page.fill('#email', 'test@test.com');
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'differentpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error')).toContainText('Passwords do not match');
  });

  test('should show error when password is too short', async ({ page }) => {
    await page.goto('/register');

    await page.fill('#email', 'test@test.com');
    await page.fill('#username', 'testuser');
    await page.fill('#password', '12345');
    await page.fill('#confirmPassword', '12345');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error')).toContainText('at least 6 characters');
  });

  test('should show error when email is already registered', async ({ page, verifiedUser }) => {
    await page.goto('/register');

    await page.fill('#email', verifiedUser.email);
    await page.fill('#username', 'differentusername');
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error')).toContainText(/already registered|already exists/i);
  });

  test('should show error when username is already taken', async ({ page, verifiedUser }) => {
    await page.goto('/register');

    await page.fill('#email', 'different@email.com');
    await page.fill('#username', verifiedUser.username);
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error')).toContainText(/already taken|already exists/i);
  });

  test('should redirect authenticated user away from register page', async ({ page, verifiedUser }) => {
    // Login first
    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });

    // Try to access register page
    await page.goto('/register');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Authentication - Login', () => {
  test('should login with valid credentials', async ({ page, verifiedUser }) => {
    await page.goto('/login');

    await page.fill('#email', verifiedUser.email);
    await page.fill('#password', verifiedUser.password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should show error with invalid email', async ({ page }) => {
    await page.goto('/login');

    await page.fill('#email', 'nonexistent@test.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error')).toContainText(/invalid|failed/i);
  });

  test('should show error with wrong password', async ({ page, verifiedUser }) => {
    await page.goto('/login');

    await page.fill('#email', verifiedUser.email);
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error')).toContainText(/invalid|failed/i);
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.locator('#password');
    const toggleButton = page.locator('.password-toggle');

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle to show
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click toggle to hide again
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should redirect authenticated user away from login page', async ({ page, verifiedUser }) => {
    // Login first via API
    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });

    // Try to access login page
    await page.goto('/login');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should preserve redirect URL after login', async ({ page, verifiedUser }) => {
    // Try to access a protected page
    await page.goto('/create');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);

    // Login
    await page.fill('#email', verifiedUser.email);
    await page.fill('#password', verifiedUser.password);
    await page.click('button[type="submit"]');

    // Should redirect back to the originally requested page
    await expect(page).toHaveURL(/\/create/, { timeout: 10000 });
  });
});

test.describe('Authentication - Email Verification', () => {
  test('should verify email with valid token', async ({ page, db }) => {
    // Register a new user
    await page.goto('/register');
    await page.fill('#email', 'verify@test.com');
    await page.fill('#username', 'verifyuser');
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Get the verification token from database
    const token = await getVerificationToken('verify@test.com');
    expect(token).toBeTruthy();

    // Visit verification URL
    await page.goto(`/verify-email?token=${token}`);

    // Should show success message
    await expect(page.locator('text=verified')).toBeVisible({ timeout: 10000 });

    // User should be verified in database
    const user = await getUser('verify@test.com');
    expect(user.email_verified).toBe(true);
  });

  test('should show error with invalid verification token', async ({ page }) => {
    await page.goto('/verify-email?token=invalid-token-12345');

    await expect(page.locator('text=/invalid|expired|error/i')).toBeVisible({ timeout: 10000 });
  });

  test('should show error with missing token', async ({ page }) => {
    await page.goto('/verify-email');

    await expect(page.locator('text=/token|required|missing/i')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Authentication - Protected Routes', () => {
  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing create page without auth', async ({ page }) => {
    await page.goto('/create');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing story page without auth', async ({ page }) => {
    await page.goto('/story/some-story-id');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing accept-invite without auth', async ({ page }) => {
    await page.goto('/accept-invite/some-token');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should allow access to landing page without auth', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=/story|word/i')).toBeVisible();
  });
});

test.describe('Authentication - Logout', () => {
  test('should logout user and redirect to home', async ({ page, verifiedUser }) => {
    // Login first
    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Find and click logout button
    await page.click('text=Logout');

    // Should redirect to home or login
    await expect(page).toHaveURL(/^\/($|login)/);

    // Should not be able to access protected routes
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Authentication - Session Persistence', () => {
  test('should persist login across page reloads', async ({ page, verifiedUser }) => {
    // Login
    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Reload page
    await page.reload();

    // Should still be on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should persist login when navigating between pages', async ({ page, verifiedUser }) => {
    // Login
    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto('/dashboard');

    // Navigate to create page
    await page.goto('/create');
    await expect(page).toHaveURL(/\/create/);

    // Navigate back to dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
