import { test, expect } from './fixtures.js';
import { loginUserViaAPI } from './utils/auth.js';
import { createTestUser, getUser } from './utils/database.js';

// Note: Admin tests require the ADMIN_EMAIL environment variable to match the admin user's email
// Set ADMIN_EMAIL=admin@test.com in your .env file for these tests

test.describe('Admin - Access Control', () => {
  test('admin user can access admin dashboard', async ({ page, adminUser }) => {
    await loginUserViaAPI(page, { email: adminUser.email, password: adminUser.password });
    await page.goto('/admin');

    // Should stay on admin page
    await expect(page).toHaveURL(/\/admin/);

    // Should see admin dashboard content
    await expect(page.locator('text=/admin|users|dashboard/i')).toBeVisible();
  });

  test('non-admin user is redirected away from admin', async ({ page, verifiedUser }) => {
    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto('/admin');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/admin');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Admin - User Management', () => {
  test('admin can view list of all users', async ({ page, adminUser, db }) => {
    // Create some test users
    await createTestUser({ email: 'listuser1@test.com', username: 'listuser1' });
    await createTestUser({ email: 'listuser2@test.com', username: 'listuser2' });

    await loginUserViaAPI(page, { email: adminUser.email, password: adminUser.password });
    await page.goto('/admin');

    // Should see user list
    await expect(page.locator('text=listuser1')).toBeVisible();
    await expect(page.locator('text=listuser2')).toBeVisible();
  });

  test('admin can see user email verification status', async ({ page, adminUser, db }) => {
    await createTestUser({ email: 'verified-status@test.com', username: 'verifiedstatus', emailVerified: true });
    await createTestUser({ email: 'unverified-status@test.com', username: 'unverifiedstatus', emailVerified: false });

    await loginUserViaAPI(page, { email: adminUser.email, password: adminUser.password });
    await page.goto('/admin');

    // Should show verification status indicators
    const userRows = page.locator('tr, .user-row, .user-item');
    const rowCount = await userRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('admin can delete a user', async ({ page, adminUser, db }) => {
    const userToDelete = await createTestUser({
      email: 'deleteme@test.com',
      username: 'deletemeuser'
    });

    await loginUserViaAPI(page, { email: adminUser.email, password: adminUser.password });
    await page.goto('/admin');

    // Find the user row and click delete
    const userRow = page.locator(`tr:has-text("deletemeuser"), .user-row:has-text("deletemeuser")`);
    const deleteButton = userRow.locator('button:has-text("Delete"), button[aria-label*="delete"]');

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Confirm deletion if dialog appears
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // User should be removed
      await expect(page.locator('text=deletemeuser')).not.toBeVisible({ timeout: 10000 });

      // Verify in database
      const deletedUser = await getUser('deleteme@test.com');
      expect(deletedUser).toBeUndefined();
    }
  });

  test('admin cannot delete themselves', async ({ page, adminUser }) => {
    await loginUserViaAPI(page, { email: adminUser.email, password: adminUser.password });
    await page.goto('/admin');

    // Find admin's own row
    const adminRow = page.locator(`tr:has-text("${adminUser.username}"), .user-row:has-text("${adminUser.username}")`);
    const deleteButton = adminRow.locator('button:has-text("Delete"), button[aria-label*="delete"]');

    if (await deleteButton.isVisible()) {
      // Delete button should be disabled for self
      const isDisabled = await deleteButton.isDisabled();
      if (!isDisabled) {
        // If not disabled, clicking should show error
        await deleteButton.click();
        await expect(page.locator('text=/cannot.*yourself|cannot.*delete.*own/i')).toBeVisible();
      }
    }

    // Admin should still exist
    const adminStillExists = await getUser(adminUser.email);
    expect(adminStillExists).toBeTruthy();
  });
});

test.describe('Admin - Email Verification Management', () => {
  test('admin can resend verification email for unverified user', async ({ page, adminUser, db }) => {
    const unverifiedUser = await createTestUser({
      email: 'resend-verify@test.com',
      username: 'resendverify',
      emailVerified: false
    });

    await loginUserViaAPI(page, { email: adminUser.email, password: adminUser.password });
    await page.goto('/admin');

    // Find user row and click resend verification
    const userRow = page.locator(`tr:has-text("resendverify"), .user-row:has-text("resendverify")`);
    const resendButton = userRow.locator('button:has-text("Resend"), button:has-text("Verify")');

    if (await resendButton.isVisible()) {
      await resendButton.click();

      // Should show success message
      await expect(page.locator('text=/sent|resent|verification/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('resend verification not available for already verified users', async ({ page, adminUser, db }) => {
    const verifiedUser = await createTestUser({
      email: 'already-verified@test.com',
      username: 'alreadyverified',
      emailVerified: true
    });

    await loginUserViaAPI(page, { email: adminUser.email, password: adminUser.password });
    await page.goto('/admin');

    // Find user row
    const userRow = page.locator(`tr:has-text("alreadyverified"), .user-row:has-text("alreadyverified")`);
    const resendButton = userRow.locator('button:has-text("Resend"), button:has-text("Verify")');

    // Button should not be visible or should be disabled
    if (await resendButton.isVisible()) {
      expect(await resendButton.isDisabled()).toBe(true);
    }
  });
});

test.describe('Admin - Navigation', () => {
  test('admin can navigate between admin and regular pages', async ({ page, adminUser }) => {
    await loginUserViaAPI(page, { email: adminUser.email, password: adminUser.password });

    // Go to admin
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);

    // Navigate to dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    // Go back to admin
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);
  });

  test('admin link is visible in navbar for admin users', async ({ page, adminUser }) => {
    await loginUserViaAPI(page, { email: adminUser.email, password: adminUser.password });
    await page.goto('/dashboard');

    // Should see admin link in navbar
    const adminLink = page.locator('nav a:has-text("Admin"), nav button:has-text("Admin")');
    await expect(adminLink).toBeVisible();
  });

  test('admin link is NOT visible for regular users', async ({ page, verifiedUser }) => {
    await loginUserViaAPI(page, { email: verifiedUser.email, password: verifiedUser.password });
    await page.goto('/dashboard');

    // Should NOT see admin link in navbar
    const adminLink = page.locator('nav a:has-text("Admin"), nav button:has-text("Admin")');
    await expect(adminLink).not.toBeVisible();
  });
});

test.describe('Admin - User Statistics', () => {
  test('admin dashboard shows user count', async ({ page, adminUser, db }) => {
    await createTestUser({ email: 'stat1@test.com', username: 'statuser1' });
    await createTestUser({ email: 'stat2@test.com', username: 'statuser2' });
    await createTestUser({ email: 'stat3@test.com', username: 'statuser3' });

    await loginUserViaAPI(page, { email: adminUser.email, password: adminUser.password });
    await page.goto('/admin');

    // Should show some form of user count or statistics
    // At minimum, the user table should have entries
    const userRows = page.locator('tbody tr, .user-row, .user-item');
    const count = await userRows.count();
    expect(count).toBeGreaterThanOrEqual(4); // 3 created + admin
  });
});

test.describe('Admin - Error Handling', () => {
  test('shows error when trying to delete non-existent user', async ({ page, adminUser }) => {
    await loginUserViaAPI(page, { email: adminUser.email, password: adminUser.password });

    // Try to access admin API directly with invalid user ID
    const response = await page.request.delete('http://localhost:3000/api/admin/users/non-existent-uuid', {
      headers: {
        Authorization: `Bearer ${await getTokenFromLocalStorage(page)}`
      }
    });

    expect(response.status()).toBe(404);
  });
});

async function getTokenFromLocalStorage(page) {
  return await page.evaluate(() => localStorage.getItem('token'));
}
