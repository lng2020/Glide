import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Dashboard, Funding Flow, and Transaction History
 * Tests VAL-205, VAL-206, VAL-207, VAL-209, VAL-210, PERF-404, PERF-405
 */

// Helper to generate unique email for each test run
const uniqueEmail = () => `test${Date.now()}@example.com`;

// Helper to complete signup flow
async function signupUser(page: any, email: string) {
  await page.goto('/signup');

  // Step 1
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill('StrongP@ss1');
  await page.locator('input[name="confirmPassword"]').fill('StrongP@ss1');
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // Step 2
  await page.locator('input[name="firstName"]').fill('Test');
  await page.locator('input[name="lastName"]').fill('User');
  await page.locator('input[name="phoneNumber"]').fill('5551234567');
  await page.locator('input[name="dateOfBirth"]').fill('1990-01-01');
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // Step 3
  await page.locator('input[name="ssn"]').fill('123456789');
  await page.locator('input[name="address"]').fill('123 Main St');
  await page.locator('input[name="city"]').fill('Test City');
  await page.locator('input[name="state"]').fill('CA');
  await page.locator('input[name="zipCode"]').fill('12345');
  await page.getByRole('button', { name: 'Create Account' }).click();

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard');
}

test.describe('Dashboard', () => {
  test('displays dashboard after login', async ({ page }) => {
    const email = uniqueEmail();
    await signupUser(page, email);

    await expect(page.getByRole('heading', { name: 'SecureBank Dashboard' })).toBeVisible();
    await expect(page.getByText("You don't have any accounts yet")).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open New Account' })).toBeVisible();
  });

  test('can create a checking account', async ({ page }) => {
    const email = uniqueEmail();
    await signupUser(page, email);

    await page.getByRole('button', { name: 'Open New Account' }).click();
    await expect(page.getByText('Create New Account')).toBeVisible();

    await page.getByLabel('Checking').check();
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Wait for modal to close and account to appear
    await expect(page.getByText('Checking Account')).toBeVisible();
    await expect(page.getByText('$0.00')).toBeVisible();
  });
});

test.describe('Funding Flow', () => {
  test('opens funding modal when clicking Fund Account', async ({ page }) => {
    const email = uniqueEmail();
    await signupUser(page, email);

    // Create account first
    await page.getByRole('button', { name: 'Open New Account' }).click();
    await page.getByLabel('Checking').check();
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByText('Checking Account')).toBeVisible();

    // Open funding modal
    await page.getByRole('button', { name: 'Fund Account' }).click();
    await expect(page.getByText('Fund Your Account')).toBeVisible();
  });

  test('validates zero amount (VAL-205)', async ({ page }) => {
    const email = uniqueEmail();
    await signupUser(page, email);

    // Create account
    await page.getByRole('button', { name: 'Open New Account' }).click();
    await page.getByLabel('Checking').check();
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByText('Checking Account')).toBeVisible();

    // Open funding modal and try zero amount
    await page.getByRole('button', { name: 'Fund Account' }).click();
    await page.locator('input[name="amount"]').fill('0');
    await page.locator('input[name="accountNumber"]').fill('4111111111111111');
    await page.getByRole('button', { name: 'Fund Account' }).click();

    await expect(page.getByText('Amount must be at least $0.01')).toBeVisible();
  });

  test('rejects leading zeros in amount (VAL-209)', async ({ page }) => {
    const email = uniqueEmail();
    await signupUser(page, email);

    // Create account
    await page.getByRole('button', { name: 'Open New Account' }).click();
    await page.getByLabel('Checking').check();
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Open funding modal
    await page.getByRole('button', { name: 'Fund Account' }).click();
    await page.locator('input[name="amount"]').fill('00100');
    await page.locator('input[name="accountNumber"]').fill('4111111111111111');
    await page.getByRole('button', { name: 'Fund Account' }).click();

    await expect(page.getByText('Invalid amount format')).toBeVisible();
  });

  test('validates card number with Luhn algorithm (VAL-206)', async ({ page }) => {
    const email = uniqueEmail();
    await signupUser(page, email);

    // Create account
    await page.getByRole('button', { name: 'Open New Account' }).click();
    await page.getByLabel('Checking').check();
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Open funding modal with invalid card
    await page.getByRole('button', { name: 'Fund Account' }).click();
    await page.locator('input[name="amount"]').fill('100');
    await page.locator('input[name="accountNumber"]').fill('4111111111111112'); // Invalid Luhn
    await page.getByRole('button', { name: 'Fund Account' }).click();

    await expect(page.getByText(/Invalid card number/i)).toBeVisible();
  });

  test('accepts valid Visa card (VAL-210)', async ({ page }) => {
    const email = uniqueEmail();
    await signupUser(page, email);

    // Create account
    await page.getByRole('button', { name: 'Open New Account' }).click();
    await page.getByLabel('Checking').check();
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Fund with valid Visa
    await page.getByRole('button', { name: 'Fund Account' }).click();
    await page.locator('input[name="amount"]').fill('100');
    await page.locator('input[name="accountNumber"]').fill('4111111111111111');
    await page.getByRole('button', { name: 'Fund Account' }).click();

    // Modal should close and balance should update
    await expect(page.getByText('Fund Your Account')).not.toBeVisible();
    await expect(page.getByText('$100.00')).toBeVisible();
  });

  test('accepts valid Amex card (VAL-210)', async ({ page }) => {
    const email = uniqueEmail();
    await signupUser(page, email);

    // Create account
    await page.getByRole('button', { name: 'Open New Account' }).click();
    await page.getByLabel('Checking').check();
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Fund with valid Amex
    await page.getByRole('button', { name: 'Fund Account' }).click();
    await page.locator('input[name="amount"]').fill('50');
    await page.locator('input[name="accountNumber"]').fill('378282246310005');
    await page.getByRole('button', { name: 'Fund Account' }).click();

    await expect(page.getByText('Fund Your Account')).not.toBeVisible();
    await expect(page.getByText('$50.00')).toBeVisible();
  });

  test('requires routing number for bank transfer (VAL-207)', async ({ page }) => {
    const email = uniqueEmail();
    await signupUser(page, email);

    // Create account
    await page.getByRole('button', { name: 'Open New Account' }).click();
    await page.getByLabel('Checking').check();
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Try bank transfer without routing number
    await page.getByRole('button', { name: 'Fund Account' }).click();
    await page.getByLabel('Bank Account').check();
    await page.locator('input[name="amount"]').fill('100');
    await page.locator('input[name="accountNumber"]').fill('123456789');
    // Don't fill routing number
    await page.getByRole('button', { name: 'Fund Account' }).click();

    await expect(page.getByText('Routing number is required')).toBeVisible();
  });

  test('accepts valid bank transfer with routing number (VAL-207)', async ({ page }) => {
    const email = uniqueEmail();
    await signupUser(page, email);

    // Create account
    await page.getByRole('button', { name: 'Open New Account' }).click();
    await page.getByLabel('Checking').check();
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Bank transfer with valid routing number (ABA checksum valid)
    await page.getByRole('button', { name: 'Fund Account' }).click();
    await page.getByLabel('Bank Account').check();
    await page.locator('input[name="amount"]').fill('200');
    await page.locator('input[name="accountNumber"]').fill('123456789');
    await page.locator('input[name="routingNumber"]').fill('021000021'); // Valid ABA
    await page.getByRole('button', { name: 'Fund Account' }).click();

    await expect(page.getByText('Fund Your Account')).not.toBeVisible();
    await expect(page.getByText('$200.00')).toBeVisible();
  });
});

test.describe('Transaction History', () => {
  test('displays transactions after funding (PERF-405)', async ({ page }) => {
    const email = uniqueEmail();
    await signupUser(page, email);

    // Create account
    await page.getByRole('button', { name: 'Open New Account' }).click();
    await page.getByLabel('Checking').check();
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Fund account
    await page.getByRole('button', { name: 'Fund Account' }).click();
    await page.locator('input[name="amount"]').fill('100');
    await page.locator('input[name="accountNumber"]').fill('4111111111111111');
    await page.getByRole('button', { name: 'Fund Account' }).click();
    await expect(page.getByText('$100.00')).toBeVisible();

    // Click on account to view transactions
    await page.getByText('Checking Account').click();

    // Verify transaction appears
    await expect(page.getByText('Transaction History')).toBeVisible();
    await expect(page.getByText('Funding from card')).toBeVisible();
    await expect(page.getByText('deposit')).toBeVisible();
  });

  test('shows multiple transactions in correct order (PERF-404)', async ({ page }) => {
    const email = uniqueEmail();
    await signupUser(page, email);

    // Create account
    await page.getByRole('button', { name: 'Open New Account' }).click();
    await page.getByLabel('Checking').check();
    await page.getByRole('button', { name: 'Create Account' }).click();

    // First funding
    await page.getByRole('button', { name: 'Fund Account' }).click();
    await page.locator('input[name="amount"]').fill('50');
    await page.locator('input[name="accountNumber"]').fill('4111111111111111');
    await page.getByRole('button', { name: 'Fund Account' }).click();
    await expect(page.getByText('$50.00')).toBeVisible();

    // Second funding
    await page.getByRole('button', { name: 'Fund Account' }).click();
    await page.locator('input[name="amount"]').fill('75');
    await page.locator('input[name="accountNumber"]').fill('4111111111111111');
    await page.getByRole('button', { name: 'Fund Account' }).click();
    await expect(page.getByText('$125.00')).toBeVisible();

    // View transactions
    await page.getByText('Checking Account').click();

    // Both transactions should be visible
    const depositRows = page.getByText('Funding from card');
    await expect(depositRows).toHaveCount(2);

    // Verify amounts (most recent first due to PERF-404 fix)
    const amounts = page.locator('td').filter({ hasText: /\+\$/ });
    await expect(amounts.first()).toContainText('$75.00');
    await expect(amounts.last()).toContainText('$50.00');
  });

  test('shows no transactions message for new account', async ({ page }) => {
    const email = uniqueEmail();
    await signupUser(page, email);

    // Create account
    await page.getByRole('button', { name: 'Open New Account' }).click();
    await page.getByLabel('Checking').check();
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Click account without funding
    await page.getByText('Checking Account').click();

    await expect(page.getByText('Transaction History')).toBeVisible();
    await expect(page.getByText('No transactions yet')).toBeVisible();
  });
});

test.describe('Logout', () => {
  test('can logout from dashboard', async ({ page }) => {
    const email = uniqueEmail();
    await signupUser(page, email);

    await page.getByRole('button', { name: 'Sign Out' }).click();
    await expect(page).toHaveURL('/');
  });
});
