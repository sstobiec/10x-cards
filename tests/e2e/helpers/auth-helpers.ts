import { Page } from "@playwright/test";

/**
 * Test user credentials from environment variables
 */
export const TEST_USER = {
  id: process.env.E2E_USERNAME_ID || "",
  email: process.env.E2E_USERNAME || "",
  password: process.env.E2E_PASSWORD || "",
};

/**
 * Login with test user credentials
 * @param page - Playwright page object
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  await login(page, TEST_USER.email, TEST_USER.password);
}

/**
 * Login with custom credentials
 * @param page - Playwright page object
 * @param email - User email
 * @param password - User password
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  // Navigate to login page
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  // Fill in credentials
  await page.getByTestId("login-email-input").fill(email);
  await page.getByTestId("login-password-input").fill(password);

  // Submit form and wait for navigation
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 }),
    page.getByTestId("auth-submit-button").click(),
  ]);

  await page.waitForLoadState("networkidle");
}

/**
 * Logout the current user
 * @param page - Playwright page object
 */
export async function logout(page: Page): Promise<void> {
  // Navigate to logout endpoint or click logout button
  await page.goto("/api/auth/logout");
  await page.waitForLoadState("networkidle");
}

/**
 * Check if user is logged in by checking for redirect behavior
 * @param page - Playwright page object
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Try to access a protected route
  await page.goto("/generate");
  await page.waitForLoadState("networkidle");

  // If redirected to login, user is not logged in
  return !page.url().includes("/login");
}

