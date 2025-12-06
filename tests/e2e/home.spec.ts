import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Home Page
 */

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays welcome message', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome to SecureBank' })).toBeVisible();
  });

  test('displays feature list', async ({ page }) => {
    await expect(page.getByText('No monthly fees on checking accounts')).toBeVisible();
    await expect(page.getByText('Competitive savings rates')).toBeVisible();
    await expect(page.getByText('24/7 customer support')).toBeVisible();
    await expect(page.getByText('State-of-the-art security')).toBeVisible();
  });

  test('has working navigation to signup', async ({ page }) => {
    await page.getByRole('link', { name: 'Open an Account' }).click();
    await expect(page).toHaveURL('/signup');
  });

  test('has working navigation to login', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/login');
  });
});
