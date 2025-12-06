import { describe, it, expect } from 'vitest';

/**
 * Performance & Logic Bug Fix Tests
 * PERF-406: Balance Calculation Precision
 * (Other PERF tests are in integration tests with actual DB)
 */

describe('PERF-406: Balance Calculation Precision', () => {
  // Replicate the balance calculation from account.ts
  function calculateNewBalance(currentBalance: number, amount: number): number {
    return Math.round((currentBalance + amount) * 100) / 100;
  }

  it('avoids classic floating point errors (0.1 + 0.2 = 0.3)', () => {
    // Without fix: 0.1 + 0.2 = 0.30000000000000004
    expect(calculateNewBalance(0.1, 0.2)).toBe(0.3);
  });

  it('handles penny additions correctly', () => {
    expect(calculateNewBalance(10.99, 0.01)).toBe(11);
    expect(calculateNewBalance(99.99, 0.01)).toBe(100);
  });

  it('maintains precision after multiple operations', () => {
    let balance = 0;
    // Add $0.10 ten times
    for (let i = 0; i < 10; i++) {
      balance = calculateNewBalance(balance, 0.1);
    }
    // Without fix: would be 0.9999999999999999
    expect(balance).toBe(1);
  });

  it('handles typical banking amounts', () => {
    expect(calculateNewBalance(1234.56, 78.90)).toBe(1313.46);
    expect(calculateNewBalance(500.00, 250.50)).toBe(750.5);
    expect(calculateNewBalance(100, 19.99)).toBe(119.99);
  });

  it('handles large amounts', () => {
    expect(calculateNewBalance(999999.99, 0.01)).toBe(1000000);
    expect(calculateNewBalance(1000000, 0.01)).toBe(1000000.01);
  });

  it('rounds to 2 decimal places', () => {
    // Input with more than 2 decimals should round
    expect(calculateNewBalance(0, 1.999)).toBe(2);
    expect(calculateNewBalance(0, 1.994)).toBe(1.99);
    expect(calculateNewBalance(0, 1.995)).toBe(2);
  });
});
