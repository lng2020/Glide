import { describe, it, expect } from 'vitest';
import { encryptSSN, decryptSSN, maskSSN, getSSNLastFour } from '@/lib/crypto';

describe('SSN Encryption', () => {
  const testSSN = '123456789';

  describe('encryptSSN', () => {
    it('returns encrypted string with iv:authTag:ciphertext format', () => {
      const encrypted = encryptSSN(testSSN);
      const parts = encrypted.split(':');

      expect(parts).toHaveLength(3);
      expect(parts[0]).toHaveLength(32); // IV is 16 bytes = 32 hex chars
      expect(parts[1]).toHaveLength(32); // authTag is 16 bytes = 32 hex chars
      expect(parts[2].length).toBeGreaterThan(0); // ciphertext exists
    });

    it('encrypted SSN is different from plaintext', () => {
      const encrypted = encryptSSN(testSSN);

      expect(encrypted).not.toBe(testSSN);
      expect(encrypted).not.toContain(testSSN);
    });

    it('same SSN produces different ciphertext (due to random IV)', () => {
      const encrypted1 = encryptSSN(testSSN);
      const encrypted2 = encryptSSN(testSSN);

      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('decryptSSN', () => {
    it('correctly decrypts encrypted SSN', () => {
      const encrypted = encryptSSN(testSSN);
      const decrypted = decryptSSN(encrypted);

      expect(decrypted).toBe(testSSN);
    });

    it('throws error for invalid format', () => {
      expect(() => decryptSSN('invalid')).toThrow('Invalid encrypted SSN format');
      expect(() => decryptSSN('a:b')).toThrow('Invalid encrypted SSN format');
      expect(() => decryptSSN('')).toThrow('Invalid encrypted SSN format');
    });

    it('throws error for tampered data', () => {
      const encrypted = encryptSSN(testSSN);
      const parts = encrypted.split(':');
      // Tamper with the ciphertext
      parts[2] = 'ff' + parts[2].slice(2);
      const tampered = parts.join(':');

      expect(() => decryptSSN(tampered)).toThrow();
    });
  });

  describe('maskSSN', () => {
    it('returns masked format with last 4 digits', () => {
      expect(maskSSN(testSSN)).toBe('XXX-XX-6789');
    });

    it('returns full mask for invalid SSN length', () => {
      expect(maskSSN('12345')).toBe('XXX-XX-XXXX');
      expect(maskSSN('1234567890')).toBe('XXX-XX-XXXX');
      expect(maskSSN('')).toBe('XXX-XX-XXXX');
    });
  });

  describe('getSSNLastFour', () => {
    it('returns last 4 digits', () => {
      expect(getSSNLastFour(testSSN)).toBe('6789');
    });

    it('handles short strings', () => {
      expect(getSSNLastFour('12')).toBe('12');
      expect(getSSNLastFour('')).toBe('');
    });
  });
});
