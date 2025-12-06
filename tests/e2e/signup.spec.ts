import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Signup Flow
 * Tests VAL-201 to VAL-208 validation in real browser
 */

test.describe('Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('displays step 1 of 3 initially', async ({ page }) => {
    await expect(page.getByText('Step 1 of 3')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
  });

  test('shows email typo suggestion for .con domain (VAL-201)', async ({ page }) => {
    await page.locator('input[name="email"]').fill('user@gmail.con');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    await expect(page.getByText(/did you mean.*\.com/i)).toBeVisible();
  });

  test('rejects weak passwords (VAL-208)', async ({ page }) => {
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('weak');
    await page.locator('input[name="confirmPassword"]').fill('weak');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
  });

  test('rejects password without uppercase (VAL-208)', async ({ page }) => {
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('lowercase1!');
    await page.locator('input[name="confirmPassword"]').fill('lowercase1!');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    await expect(page.getByText('Password must contain an uppercase letter')).toBeVisible();
  });

  test('rejects common passwords (VAL-208)', async ({ page }) => {
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('password');
    await page.locator('input[name="confirmPassword"]').fill('password');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    await expect(page.getByText('Password is too common')).toBeVisible();
  });

  test('validates password confirmation match', async ({ page }) => {
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('StrongP@ss1');
    await page.locator('input[name="confirmPassword"]').fill('DifferentP@ss1');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('proceeds to step 2 with valid step 1 data', async ({ page }) => {
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('StrongP@ss1');
    await page.locator('input[name="confirmPassword"]').fill('StrongP@ss1');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    await expect(page.getByText('Step 2 of 3')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
  });

  test('validates phone number format (VAL-204)', async ({ page }) => {
    // Navigate to step 2
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('StrongP@ss1');
    await page.locator('input[name="confirmPassword"]').fill('StrongP@ss1');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    await page.locator('input[name="firstName"]').fill('John');
    await page.locator('input[name="lastName"]').fill('Doe');
    await page.locator('input[name="phoneNumber"]').fill('555-123-4567'); // Invalid format
    await page.locator('input[name="dateOfBirth"]').fill('1990-01-01');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    await expect(page.getByText(/10 digits.*international/i)).toBeVisible();
  });

  test('accepts valid US phone number (VAL-204)', async ({ page }) => {
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('StrongP@ss1');
    await page.locator('input[name="confirmPassword"]').fill('StrongP@ss1');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    await page.locator('input[name="firstName"]').fill('John');
    await page.locator('input[name="lastName"]').fill('Doe');
    await page.locator('input[name="phoneNumber"]').fill('5551234567');
    await page.locator('input[name="dateOfBirth"]').fill('1990-01-01');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    await expect(page.getByText('Step 3 of 3')).toBeVisible();
  });

  test('rejects invalid state code (VAL-203)', async ({ page }) => {
    // Navigate through steps 1 and 2
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('StrongP@ss1');
    await page.locator('input[name="confirmPassword"]').fill('StrongP@ss1');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    await page.locator('input[name="firstName"]').fill('John');
    await page.locator('input[name="lastName"]').fill('Doe');
    await page.locator('input[name="phoneNumber"]').fill('5551234567');
    await page.locator('input[name="dateOfBirth"]').fill('1990-01-01');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Step 3 - enter invalid state
    await page.locator('input[name="ssn"]').fill('123456789');
    await page.locator('input[name="address"]').fill('123 Main St');
    await page.locator('input[name="city"]').fill('Test City');
    await page.locator('input[name="state"]').fill('XX'); // Invalid state
    await page.locator('input[name="zipCode"]').fill('12345');

    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('Invalid US state code')).toBeVisible();
  });

  test('can navigate back to previous steps', async ({ page }) => {
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('StrongP@ss1');
    await page.locator('input[name="confirmPassword"]').fill('StrongP@ss1');
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    await expect(page.getByText('Step 2 of 3')).toBeVisible();
    await page.getByRole('button', { name: 'Previous' }).click();

    await expect(page.getByText('Step 1 of 3')).toBeVisible();
    // Form should retain values
    await expect(page.locator('input[name="email"]')).toHaveValue('test@example.com');
  });
});
