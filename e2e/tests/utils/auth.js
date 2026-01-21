import { expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3000';

/**
 * Register a new user via the UI
 */
export async function registerUser(page, { email, username, password }) {
  await page.goto('/register');
  await page.fill('#email', email);
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.fill('#confirmPassword', password);
  await page.click('button[type="submit"]');
}

/**
 * Login a user via the UI
 */
export async function loginUser(page, { email, password }) {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
}

/**
 * Login a user via API and set localStorage
 */
export async function loginUserViaAPI(page, { email, password }) {
  const response = await page.request.post(`${API_URL}/api/auth/login`, {
    data: { email, password },
  });

  const data = await response.json();

  if (response.ok()) {
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }, data);
  }

  return { response, data };
}

/**
 * Register a user via API
 */
export async function registerUserViaAPI({ email, username, password }) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password }),
  });
  return response.json();
}

/**
 * Get auth token for a user
 */
export async function getAuthToken({ email, password }) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  return data.token;
}

/**
 * Logout user by clearing localStorage
 */
export async function logoutUser(page) {
  await page.evaluate(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  });
}

/**
 * Check if user is on the login page
 */
export async function expectOnLoginPage(page) {
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('h1')).toContainText('Welcome Back');
}

/**
 * Check if user is on the dashboard
 */
export async function expectOnDashboard(page) {
  await expect(page).toHaveURL(/\/dashboard/);
}

/**
 * Set authenticated state directly in localStorage
 */
export async function setAuthState(page, { token, user }) {
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, { token, user });
}

/**
 * Create authenticated API request context
 */
export async function createAuthenticatedContext(page, token) {
  return page.request.newContext({
    extraHTTPHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}
