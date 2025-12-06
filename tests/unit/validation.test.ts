import { describe, it, expect } from 'vitest';
import {
  isValidCardNumber,
  getCardType,
  isValidState,
  isValidPhoneNumber,
  isValidAmount,
  detectEmailTypo,
  validatePassword,
  validateDOB,
  isValidRoutingNumber,
  isValidEmail,
  isValidSSN,
  isValidZipCode,
  VALID_STATES,
} from '@/lib/validation';

/**
 * Validation Function Tests
 * Tests for VAL-201 to VAL-210
 */

describe('VAL-201: Email Typo Detection', () => {
  it('detects .con typo and suggests .com', () => {
    expect(detectEmailTypo('user@gmail.con')).toBe('.com');
  });

  it('detects .cm typo and suggests .com', () => {
    expect(detectEmailTypo('user@yahoo.cm')).toBe('.com');
  });

  it('detects .cpm typo and suggests .com', () => {
    expect(detectEmailTypo('user@test.cpm')).toBe('.com');
  });

  it('detects .og typo and suggests .org', () => {
    expect(detectEmailTypo('user@nonprofit.og')).toBe('.org');
  });

  it('detects .ent typo and suggests .net', () => {
    expect(detectEmailTypo('user@company.ent')).toBe('.net');
  });

  it('detects .nett typo and suggests .net', () => {
    expect(detectEmailTypo('user@company.nett')).toBe('.net');
  });

  it('returns null for valid domains', () => {
    expect(detectEmailTypo('user@example.com')).toBeNull();
    expect(detectEmailTypo('user@example.org')).toBeNull();
    expect(detectEmailTypo('user@example.net')).toBeNull();
    expect(detectEmailTypo('user@example.io')).toBeNull();
  });
});

describe('VAL-201: Email Format Validation', () => {
  it('accepts valid email formats', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.org')).toBe(true);
    expect(isValidEmail('user+tag@gmail.com')).toBe(true);
  });

  it('rejects invalid email formats', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
  });
});

describe('VAL-202: Date of Birth Validation', () => {
  it('rejects users under 18', () => {
    const today = new Date();
    const under18 = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());
    const result = validateDOB(under18.toISOString().split('T')[0]);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('18');
  });

  it('rejects future dates', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const result = validateDOB(future.toISOString().split('T')[0]);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('future');
  });

  it('accepts users 18 years old', () => {
    const today = new Date();
    const age18 = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate() - 1);
    const result = validateDOB(age18.toISOString().split('T')[0]);

    expect(result.valid).toBe(true);
  });

  it('accepts users over 18', () => {
    const result = validateDOB('1990-01-01');
    expect(result.valid).toBe(true);
  });

  it('rejects invalid date format', () => {
    const result = validateDOB('not-a-date');
    expect(result.valid).toBe(false);
  });
});

describe('VAL-203: State Code Validation', () => {
  it('accepts all 50 US states', () => {
    const states = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];
    states.forEach(state => {
      expect(isValidState(state)).toBe(true);
    });
  });

  it('accepts DC', () => {
    expect(isValidState('DC')).toBe(true);
  });

  it('accepts lowercase state codes', () => {
    expect(isValidState('ca')).toBe(true);
    expect(isValidState('ny')).toBe(true);
  });

  it('rejects invalid codes', () => {
    expect(isValidState('XX')).toBe(false);
    expect(isValidState('ZZ')).toBe(false);
    expect(isValidState('AB')).toBe(false);
  });

  it('VALID_STATES contains 51 entries', () => {
    expect(VALID_STATES.length).toBe(51);
  });
});

describe('VAL-204: Phone Number Validation', () => {
  it('accepts 10-digit US numbers', () => {
    expect(isValidPhoneNumber('5551234567')).toBe(true);
    expect(isValidPhoneNumber('1234567890')).toBe(true);
  });

  it('accepts international format (+11-15 digits)', () => {
    expect(isValidPhoneNumber('+15551234567')).toBe(true);
    expect(isValidPhoneNumber('+12345678901')).toBe(true);
    expect(isValidPhoneNumber('+123456789012345')).toBe(true);
  });

  it('rejects formatted numbers', () => {
    expect(isValidPhoneNumber('555-123-4567')).toBe(false);
    expect(isValidPhoneNumber('555 123 4567')).toBe(false);
    expect(isValidPhoneNumber('(555) 123-4567')).toBe(false);
  });

  it('rejects invalid lengths', () => {
    expect(isValidPhoneNumber('555123456')).toBe(false);
    expect(isValidPhoneNumber('+1234567890123456')).toBe(false);
  });
});

describe('VAL-205 & VAL-209: Amount Validation', () => {
  it('accepts valid amounts', () => {
    expect(isValidAmount('0')).toBe(true);
    expect(isValidAmount('1')).toBe(true);
    expect(isValidAmount('100')).toBe(true);
    expect(isValidAmount('0.50')).toBe(true);
    expect(isValidAmount('100.99')).toBe(true);
  });

  it('rejects leading zeros', () => {
    expect(isValidAmount('00')).toBe(false);
    expect(isValidAmount('01')).toBe(false);
    expect(isValidAmount('001')).toBe(false);
    expect(isValidAmount('00.50')).toBe(false);
  });

  it('rejects more than 2 decimal places', () => {
    expect(isValidAmount('1.999')).toBe(false);
    expect(isValidAmount('100.123')).toBe(false);
  });
});

describe('VAL-206: Card Number Validation (Luhn)', () => {
  it('accepts valid Visa', () => {
    expect(isValidCardNumber('4111111111111111')).toBe(true);
  });

  it('accepts valid Mastercard', () => {
    expect(isValidCardNumber('5500000000000004')).toBe(true);
  });

  it('accepts valid Amex', () => {
    expect(isValidCardNumber('378282246310005')).toBe(true);
  });

  it('accepts valid Discover', () => {
    expect(isValidCardNumber('6011111111111117')).toBe(true);
  });

  it('rejects invalid checksum', () => {
    expect(isValidCardNumber('4111111111111112')).toBe(false);
  });

  it('rejects wrong length', () => {
    expect(isValidCardNumber('411111111111')).toBe(false);
    expect(isValidCardNumber('41111111111111111111')).toBe(false);
  });

  it('rejects non-numeric', () => {
    expect(isValidCardNumber('4111-1111-1111-1111')).toBe(false);
  });
});

describe('VAL-207: Routing Number Validation', () => {
  it('accepts 9-digit routing numbers', () => {
    expect(isValidRoutingNumber('123456789')).toBe(true);
  });

  it('rejects wrong lengths', () => {
    expect(isValidRoutingNumber('12345678')).toBe(false);
    expect(isValidRoutingNumber('1234567890')).toBe(false);
  });

  it('rejects non-numeric', () => {
    expect(isValidRoutingNumber('12345678a')).toBe(false);
  });
});

describe('VAL-208: Password Strength', () => {
  it('requires minimum 8 characters', () => {
    const result = validatePassword('Ab1!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  it('requires uppercase letter', () => {
    const result = validatePassword('abcd1234!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain an uppercase letter');
  });

  it('requires lowercase letter', () => {
    const result = validatePassword('ABCD1234!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain a lowercase letter');
  });

  it('requires number', () => {
    const result = validatePassword('Abcdefgh!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain a number');
  });

  it('requires special character', () => {
    const result = validatePassword('Abcd1234');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain a special character');
  });

  it('rejects common passwords', () => {
    const result = validatePassword('password');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password is too common');
  });

  it('accepts valid strong password', () => {
    const result = validatePassword('StrongP@ss1');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('VAL-210: Card Type Detection', () => {
  it('detects Visa (starts with 4)', () => {
    expect(getCardType('4111111111111111')).toBe('Visa');
  });

  it('detects Mastercard (51-55, 22-27)', () => {
    expect(getCardType('5111111111111111')).toBe('Mastercard');
    expect(getCardType('2221000000000000')).toBe('Mastercard');
  });

  it('detects Amex (34, 37)', () => {
    expect(getCardType('378282246310005')).toBe('Amex');
    expect(getCardType('341111111111111')).toBe('Amex');
  });

  it('detects Discover (6011, 65, 644-649)', () => {
    expect(getCardType('6011111111111117')).toBe('Discover');
    expect(getCardType('6500000000000000')).toBe('Discover');
  });

  it('detects Diners (36, 38, 300-305)', () => {
    expect(getCardType('36000000000000')).toBe('Diners');
  });

  it('detects JCB (35)', () => {
    expect(getCardType('3530111333300000')).toBe('JCB');
  });

  it('returns null for unknown', () => {
    expect(getCardType('1111111111111111')).toBeNull();
  });
});

describe('Other Validations', () => {
  it('validates SSN format (9 digits)', () => {
    expect(isValidSSN('123456789')).toBe(true);
    expect(isValidSSN('12345678')).toBe(false);
    expect(isValidSSN('123-45-6789')).toBe(false);
  });

  it('validates ZIP code (5 digits)', () => {
    expect(isValidZipCode('12345')).toBe(true);
    expect(isValidZipCode('1234')).toBe(false);
    expect(isValidZipCode('123456')).toBe(false);
  });
});
