/**
 * Validation utilities for SecureBank
 * Pure functions extracted for testability
 */

// Valid US state codes (50 states + DC + territories)
export const VALID_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC", "PR", "GU", "VI", "AS", "MP"
] as const;

export type USState = typeof VALID_STATES[number];

// Email typo patterns and their corrections
export const EMAIL_TYPOS: Record<string, string> = {
  ".con": ".com",
  ".cm": ".com",
  ".cpm": ".com",
  ".og": ".org",
  ".ent": ".net",
  ".nett": ".net",
};

// Card type patterns
const CARD_PATTERNS: { type: string; pattern: RegExp }[] = [
  { type: "Visa", pattern: /^4/ },
  { type: "Mastercard", pattern: /^(5[1-5]|2[2-7])/ },
  { type: "Amex", pattern: /^3[47]/ },
  { type: "Discover", pattern: /^(6011|65|64[4-9])/ },
  { type: "Diners", pattern: /^(36|38|30[0-5])/ },
  { type: "JCB", pattern: /^35/ },
];

/**
 * Detect card type from card number prefix
 */
export function getCardType(cardNumber: string): string | null {
  for (const { type, pattern } of CARD_PATTERNS) {
    if (pattern.test(cardNumber)) return type;
  }
  return null;
}

/**
 * Validate card number using Luhn algorithm
 */
export function isValidCardNumber(cardNumber: string): boolean {
  // Must be 13-19 digits
  if (!/^\d{13,19}$/.test(cardNumber)) return false;

  // Must be a recognized card type
  if (!getCardType(cardNumber)) return false;

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validate US state code
 */
export function isValidState(state: string): boolean {
  return VALID_STATES.includes(state.toUpperCase() as USState);
}

/**
 * Validate phone number format
 * Accepts: 10 digits (US) or +11-15 digits (international)
 */
export function isValidPhoneNumber(phone: string): boolean {
  return /^(\d{10}|\+\d{11,15})$/.test(phone);
}

/**
 * Validate amount format (no leading zeros, max 2 decimals)
 */
export function isValidAmount(amount: string): boolean {
  return /^(0|[1-9]\d*)(\.\d{1,2})?$/.test(amount);
}

/**
 * Detect common email typos and return suggested correction
 */
export function detectEmailTypo(email: string): string | null {
  const lower = email.toLowerCase();
  for (const [typo, correction] of Object.entries(EMAIL_TYPOS)) {
    if (lower.endsWith(typo)) {
      return correction;
    }
  }
  return null;
}

/**
 * Validate password strength requirements
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain an uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain a lowercase letter");
  }
  if (!/\d/.test(password)) {
    errors.push("Password must contain a number");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain a special character");
  }

  // Check for common passwords
  const commonPasswords = ["password", "12345678", "qwerty", "letmein", "welcome"];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push("Password is too common");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate date of birth (must be 18+ and not in the future)
 */
export function validateDOB(dob: string): { valid: boolean; error?: string } {
  const dobDate = new Date(dob);
  const today = new Date();

  // Check if valid date
  if (isNaN(dobDate.getTime())) {
    return { valid: false, error: "Invalid date format" };
  }

  // Check not in future
  if (dobDate > today) {
    return { valid: false, error: "Date of birth cannot be in the future" };
  }

  // Calculate age
  const age = today.getFullYear() - dobDate.getFullYear();
  const monthDiff = today.getMonth() - dobDate.getMonth();
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())
    ? age - 1
    : age;

  if (actualAge < 18) {
    return { valid: false, error: "You must be at least 18 years old" };
  }

  return { valid: true };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

/**
 * Validate routing number using ABA checksum algorithm
 * Format: 9 digits with checksum validation
 */
export function isValidRoutingNumber(routingNumber: string): boolean {
  if (!/^\d{9}$/.test(routingNumber)) return false;

  // ABA routing number checksum: 3(d1 + d4 + d7) + 7(d2 + d5 + d8) + (d3 + d6 + d9) mod 10 = 0
  const digits = routingNumber.split('').map(Number);
  const checksum =
    3 * (digits[0] + digits[3] + digits[6]) +
    7 * (digits[1] + digits[4] + digits[7]) +
    (digits[2] + digits[5] + digits[8]);

  return checksum % 10 === 0;
}

/**
 * Validate SSN format (9 digits)
 */
export function isValidSSN(ssn: string): boolean {
  return /^\d{9}$/.test(ssn);
}

/**
 * Validate ZIP code (5 digits)
 */
export function isValidZipCode(zipCode: string): boolean {
  return /^\d{5}$/.test(zipCode);
}
