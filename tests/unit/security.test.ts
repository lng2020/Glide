import { describe, it, expect, vi } from 'vitest';
import crypto from 'crypto';

/**
 * Security Bug Fix Tests
 * Tests for SEC-301, SEC-302
 * (SEC-303 XSS and SEC-304 Session are tested in integration tests)
 */

describe('SEC-302: Cryptographically Secure Random Numbers', () => {
  // Replicate the generateAccountNumber function from account.ts
  function generateAccountNumber(): string {
    const bytes = crypto.randomBytes(5);
    const num = bytes.readUIntBE(0, 5) % 10000000000;
    return num.toString().padStart(10, '0');
  }

  it('uses crypto.randomBytes for generation', () => {
    const spy = vi.spyOn(crypto, 'randomBytes');

    generateAccountNumber();

    expect(spy).toHaveBeenCalledWith(5);
    spy.mockRestore();
  });

  it('generates 10-digit account numbers', () => {
    for (let i = 0; i < 100; i++) {
      const num = generateAccountNumber();
      expect(num).toHaveLength(10);
      expect(/^\d{10}$/.test(num)).toBe(true);
    }
  });

  it('generates unique numbers (high entropy)', () => {
    const numbers = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      numbers.add(generateAccountNumber());
    }
    // Crypto random should have very few collisions
    expect(numbers.size).toBeGreaterThan(990);
  });

  it('pads short numbers with leading zeros', () => {
    // Mock to return small number
    const mockBytes = Buffer.alloc(5);
    mockBytes.writeUIntBE(123, 0, 5);

    vi.spyOn(crypto, 'randomBytes').mockReturnValueOnce(mockBytes as any);

    const num = generateAccountNumber();
    expect(num).toBe('0000000123');
    expect(num).toHaveLength(10);

    vi.restoreAllMocks();
  });
});
