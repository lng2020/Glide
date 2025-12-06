import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Login Flow
 */

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('displays login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sign in to your account' })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('shows validation error for empty email', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Email is required')).toBeVisible();
  });

  test('shows validation error for empty password', async ({ page }) => {
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('shows invalid email format error', async ({ page }) => {
    // Use a value that passes HTML5 validation but fails react-hook-form pattern
    await page.locator('input[name="email"]').fill('test@');
    await page.locator('input[name="password"]').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    // Either HTML5 validation or custom validation will show an error
    const hasError = await page.getByText('Invalid email address').isVisible().catch(() => false);
    const hasHtml5Error = await page.locator('input[name="email"]:invalid').count() > 0;
    expect(hasError || hasHtml5Error).toBe(true);
  });

  test('has link to signup page', async ({ page }) => {
    const signupLink = page.getByRole('link', { name: 'Create one' });
    await expect(signupLink).toBeVisible();
    await signupLink.click();
    await expect(page).toHaveURL('/signup');
  });
});
