# Bug Fix Documentation

## Table of Contents

- [Critical Fixes](#critical)
  - [SEC-301: SSN Plaintext Storage](#sec-301-ssn-plaintext-storage-critical)
  - [SEC-303: XSS Vulnerability](#sec-303-xss-vulnerability-critical)
  - [PERF-401: Account Creation Error](#perf-401-account-creation-error-critical)
  - [PERF-406: Balance Calculation](#perf-406-balance-calculation-critical)
  - [PERF-408: Resource Leak](#perf-408-resource-leak-critical)
  - [VAL-202: Date of Birth Validation](#val-202-date-of-birth-validation-critical)
  - [VAL-206: Card Number Validation](#val-206-card-number-validation-critical)
  - [VAL-208: Weak Password Requirements](#val-208-weak-password-requirements-critical)
  - [PERF-405: Missing Transactions](#perf-405-missing-transactions-critical)
- [High Priority Fixes](#high)
  - [SEC-302: Insecure Random Numbers](#sec-302-insecure-random-numbers-high)
  - [VAL-205: Zero Amount Funding](#val-205-zero-amount-funding-high)
  - [VAL-207: Routing Number Optional](#val-207-routing-number-optional-high)
  - [VAL-201: Email Validation Problems](#val-201-email-validation-problems-high)
  - [VAL-210: Card Type Detection](#val-210-card-type-detection-high)
  - [SEC-304: Session Management](#sec-304-session-management-high)
  - [PERF-403: Session Expiry](#perf-403-session-expiry-high)
  - [PERF-407: Performance Degradation](#perf-407-performance-degradation-high)
- [Medium Priority Fixes](#medium)
  - [UI-101: Dark Mode Text Visibility](#ui-101-dark-mode-text-visibility-medium)
  - [VAL-203: State Code Validation](#val-203-state-code-validation-medium)
  - [VAL-204: Phone Number Format](#val-204-phone-number-format-medium)
  - [VAL-209: Amount Input Issues](#val-209-amount-input-issues-medium)
  - [PERF-402: Logout Issues](#perf-402-logout-issues-medium)
  - [PERF-404: Transaction Sorting](#perf-404-transaction-sorting-medium)
- [Bonus: Test System](#bonus-test-system)
  - [Overview](#overview)
  - [Test Summary](#test-summary)
  - [NPM Scripts](#npm-scripts)
  - [Test Coverage by Bug Fix](#test-coverage-by-bug-fix)
  - [Architecture](#architecture)
  - [Configuration Files](#configuration-files)

---

## SEC-301: SSN Plaintext Storage (Critical)

- **Cause**: SSN was stored as plain text in the database (`lib/db/schema.ts:12`, `server/routers/auth.ts:39-42`).
- **Fix**: Added AES-256-GCM encryption via `lib/crypto.ts`; store only encrypted SSN and last 4 digits for display.
- **Prevention**: Require security review for PII fields; use encryption utilities for all sensitive data by default.
- **Commit**: [`62533fe`](https://github.com/lng2020/Glide/commit/62533fe)

## SEC-303: XSS Vulnerability (Critical)

- **Cause**: Used `dangerouslySetInnerHTML` to render transaction descriptions (`components/TransactionList.tsx:71`).
- **Fix**: Render description as plain text using `{transaction.description || "-"}`.
- **Prevention**: Ban `dangerouslySetInnerHTML` via ESLint rule; use text content or sanitization libraries when HTML is required.
- **Commit**: [`18feba9`](https://github.com/lng2020/Glide/commit/18feba9)

## PERF-401: Account Creation Error (Critical)

- **Cause**: Returned fake account with $100 balance when DB fetch failed after insert (`server/routers/account.ts:57-67`).
- **Fix**: Throw `INTERNAL_SERVER_ERROR` instead of returning fallback object with incorrect data.
- **Prevention**: Never return fallback objects with fake data; fail explicitly on database errors.
- **Commit**: [`b9c9f87`](https://github.com/lng2020/Glide/commit/b9c9f87)

## PERF-406: Balance Calculation (Critical)

- **Cause**: Used loop with float division causing precision errors (`server/routers/account.ts:133-136`).
- **Fix**: Use `Math.round((balance + amount) * 100) / 100` to maintain 2 decimal precision.
- **Prevention**: Use integer cents for all monetary calculations or a decimal library like `decimal.js`.
- **Commit**: [`3e91c1a`](https://github.com/lng2020/Glide/commit/3e91c1a)

## VAL-202: Date of Birth Validation (Critical)

- **Cause**: DOB field only checked for required, no age or future date validation (`app/signup/page.tsx:192`, `server/routers/auth.ts:19`).
- **Fix**: Added client and server validation requiring user to be 18+ and DOB not in the future.
- **Prevention**: Define validation rules in shared schema; use Zod refinements for complex business rules.
- **Commit**: [`c78ac5e`](https://github.com/lng2020/Glide/commit/c78ac5e)

## VAL-206: Card Number Validation (Critical)

- **Cause**: Only checked card prefix (4 or 5), no checksum validation (`components/FundingModal.tsx:119-123`).
- **Fix**: Implemented Luhn algorithm for proper card number validation; accept 13-19 digit cards.
- **Prevention**: Use industry-standard validation algorithms; consider payment processing libraries.
- **Commit**: [`6059331`](https://github.com/lng2020/Glide/commit/6059331)

## VAL-208: Weak Password Requirements (Critical)

- **Cause**: Password validation only checked length and one number (`app/signup/page.tsx:107-113`, `server/routers/auth.ts:16`).
- **Fix**: Require uppercase, lowercase, number, and special character on both client and server.
- **Prevention**: Use shared password policy constants; consider password strength libraries like `zxcvbn`.
- **Commit**: [`22de4b3`](https://github.com/lng2020/Glide/commit/22de4b3)

## PERF-405: Missing Transactions (Critical)

- **Cause**: Query missing `.all()` call to fetch all transaction records (`server/routers/account.ts:171-174`).
- **Fix**: Added explicit `.all()` to ensure all matching transactions are returned.
- **Prevention**: Use consistent query patterns; add integration tests for list endpoints with multiple records.
- **Commit**: [`5d528b6`](https://github.com/lng2020/Glide/commit/5d528b6)

## SEC-302: Insecure Random Numbers (High)

- **Cause**: Account numbers generated with `Math.random()` which is predictable (`server/routers/account.ts:8-12`).
- **Fix**: Use `crypto.randomBytes()` for cryptographically secure random number generation.
- **Prevention**: Lint rules to ban `Math.random()` in security-sensitive contexts; use crypto module for all IDs.
- **Commit**: [`de40f40`](https://github.com/lng2020/Glide/commit/de40f40)

## VAL-201: Email Validation Problems (High)

- **Cause**: Weak email regex and no typo detection; lowercase conversion without user notice (`app/signup/page.tsx:83-89`).
- **Fix**: Improved regex pattern, added common TLD typo detection (.con, .cm), added lowercase hint.
- **Prevention**: Use email validation libraries; provide real-time feedback on input transformations.
- **Commit**: [`38433c3`](https://github.com/lng2020/Glide/commit/38433c3)

## VAL-205: Zero Amount Funding (High)

- **Cause**: Client min validation set to 0.0 instead of 0.01 (`components/FundingModal.tsx:78`).
- **Fix**: Changed min value from 0.0 to 0.01; server already validates with `z.number().positive()`.
- **Prevention**: Use constants for validation limits; add integration tests for boundary values.
- **Commit**: [`7b7d578`](https://github.com/lng2020/Glide/commit/7b7d578)

## VAL-207: Routing Number Optional (High)

- **Cause**: Server schema had routing number as optional regardless of transfer type (`server/routers/account.ts:82`).
- **Fix**: Added Zod refinement to require 9-digit routing number when funding type is "bank".
- **Prevention**: Use discriminated unions or refinements for conditional validation requirements.
- **Commit**: [`49c8b3f`](https://github.com/lng2020/Glide/commit/49c8b3f)

## VAL-210: Card Type Detection (High)

- **Cause**: Only accepted Visa (4) and Mastercard (5) prefixes, rejecting valid Amex, Discover, etc. (`components/FundingModal.tsx:119-123`).
- **Fix**: Added `getCardType()` function to detect Visa, Mastercard, Amex, Discover, Diners, and JCB cards.
- **Prevention**: Use payment processing libraries that handle card type detection and validation.
- **Commit**: [`062f53f`](https://github.com/lng2020/Glide/commit/062f53f)

## PERF-408: Resource Leak (Critical)

- **Cause**: `initDb()` created new DB connection each call, stored in array but never closed (`lib/db/index.ts:13-14`).
- **Fix**: Removed unnecessary connection creation; use existing singleton `sqlite` connection for initialization.
- **Prevention**: Code review for resource management; use connection pooling patterns with proper cleanup.
- **Commit**: [`62533fe`](https://github.com/lng2020/Glide/commit/62533fe)

## SEC-304: Session Management (High)

- **Cause**: Login created new sessions without invalidating existing ones, allowing unlimited concurrent sessions per user (`server/routers/auth.ts:148-159`).
- **Fix**: Delete all existing sessions for user before creating new one (single session policy) in both signup and login.
- **Prevention**: Define session policy upfront (single vs. limited); implement session management as reusable middleware.
- **Commit**: [`972c623`](https://github.com/lng2020/Glide/commit/972c623)

## PERF-403: Session Expiry (High)

- **Cause**: Sessions expiring soon only logged a warning without taking action, causing abrupt logouts for active users (`server/trpc.ts:60-62`).
- **Fix**: Auto-extend session by 1 hour when active user's session is within 60 seconds of expiry (sliding session).
- **Prevention**: Define session renewal strategy upfront; implement sliding sessions for better UX in non-critical apps.
- **Commit**: [`98b89a9`](https://github.com/lng2020/Glide/commit/98b89a9)

## PERF-407: Performance Degradation (High)

- **Cause**: N+1 query problem in `getTransactions` - fetched same account from DB for every transaction in a loop (`server/routers/account.ts:177-185`).
- **Fix**: Reuse already-fetched `account` variable instead of re-querying; use `.map()` instead of loop with await.
- **Prevention**: Use query analysis tools; avoid database calls inside loops; prefer joins or batch queries.
- **Commit**: [`055abfc`](https://github.com/lng2020/Glide/commit/055abfc)

## PERF-402: Logout Issues (Medium)

- **Cause**: Logout always returned `success: true` without verifying session deletion; only attempted deletion when `ctx.user` existed (`server/routers/auth.ts:185-208`).
- **Fix**: Always extract token regardless of ctx.user; verify session exists before deletion; return accurate success status.
- **Prevention**: Verify side effects before reporting success; don't assume operations succeeded without confirmation.
- **Commit**: [`f25b68c`](https://github.com/lng2020/Glide/commit/f25b68c)

## UI-101: Dark Mode Text Visibility (Medium)

- **Cause**: Form inputs inherited light text color from dark mode body while keeping white backgrounds (`app/globals.css`).
- **Fix**: Added global CSS rule to explicitly set dark text and white background for inputs in dark mode.
- **Prevention**: Test all UI components in both light and dark modes; use CSS variables consistently for all color properties.
- **Commit**: [`14be349`](https://github.com/lng2020/Glide/commit/14be349)

## VAL-203: State Code Validation (Medium)

- **Cause**: Validation only checked for 2 uppercase letters, accepting invalid codes like "XX" (`app/signup/page.tsx:287`, `server/routers/auth.ts:38`).
- **Fix**: Validate against list of 50 US states + DC on both client and server.
- **Prevention**: Use authoritative data sources for validation lists; share constants between client and server.
- **Commit**: [`360f484`](https://github.com/lng2020/Glide/commit/360f484)

## VAL-204: Phone Number Format (Medium)

- **Cause**: Client only accepted US 10-digit format; server pattern was inconsistent and too loose (`app/signup/page.tsx:192`, `server/routers/auth.ts:25`).
- **Fix**: Aligned both to `/^(\d{10}|\+\d{11,15})$/` - accepts US (10 digits) or international (+11-15 digits).
- **Prevention**: Share validation patterns between client and server; use established phone validation libraries.
- **Commit**: [`fc5a5f5`](https://github.com/lng2020/Glide/commit/fc5a5f5)

## VAL-209: Amount Input Issues (Medium)

- **Cause**: Amount regex `/^\d+\.?\d{0,2}$/` allowed multiple leading zeros like "00100" (`components/FundingModal.tsx:116`).
- **Fix**: Changed pattern to `/^(0|[1-9]\d*)(\.\d{1,2})?$/` which only allows single zero or numbers starting with 1-9.
- **Prevention**: Test validation patterns with edge cases; use established currency input libraries.
- **Commit**: [`87ddd13`](https://github.com/lng2020/Glide/commit/87ddd13)

## PERF-404: Transaction Sorting (Medium)

- **Cause**: `getTransactions` query had no `orderBy` clause, returning transactions in unpredictable order (`server/routers/account.ts:171-175`).
- **Fix**: Added `.orderBy(desc(transactions.createdAt))` to return newest transactions first.
- **Prevention**: Always specify explicit ordering for list queries; add default sort order to query builders.
- **Commit**: [`0b91fe8`](https://github.com/lng2020/Glide/commit/0b91fe8)

---

## Bonus: Test System

### Overview

A comprehensive test system was implemented covering unit, integration, and E2E tests using:

- **Vitest** - Unit and integration test runner
- **Playwright** - End-to-end browser automation
- **better-sqlite3** - In-memory SQLite for integration tests

### Test Summary

| Type | Count | Framework | Location |
|------|-------|-----------|----------|
| Unit | 72 | Vitest | `tests/unit/` |
| Integration | 9 | Vitest + SQLite | `tests/integration/` |
| E2E | 20 | Playwright | `tests/e2e/` |
| **Total** | **101** | | |

### NPM Scripts

```bash
npm run test          # Run unit/integration tests (watch mode)
npm run test:run      # Run unit/integration tests once
npm run test:e2e      # Run E2E tests headlessly
npm run test:e2e:ui   # Run E2E with Playwright UI
npm run test:e2e:headed # Run E2E with visible browser
```

### Test Coverage by Bug Fix

| Issue | Type | Test Location | Tests |
|-------|------|---------------|-------|
| SEC-301 | Unit | `tests/unit/crypto.test.ts:4` | 10 |
| SEC-301 | Integration | `tests/integration/auth.test.ts:51` | 2 |
| SEC-302 | Unit | `tests/unit/security.test.ts:10` | 4 |
| SEC-302 | Integration | `tests/integration/account.test.ts:48` | 1 |
| SEC-304 | Integration | `tests/integration/auth.test.ts:95` | 2 |
| VAL-201 | Unit | `tests/unit/validation.test.ts:23` | 9 |
| VAL-201 | E2E | `tests/e2e/signup.spec.ts:20` | 1 |
| VAL-202 | Unit | `tests/unit/validation.test.ts:70` | 5 |
| VAL-203 | Unit | `tests/unit/validation.test.ts:108` | 5 |
| VAL-203 | E2E | `tests/e2e/signup.spec.ts:104` | 1 |
| VAL-204 | Unit | `tests/unit/validation.test.ts:142` | 4 |
| VAL-204 | E2E | `tests/e2e/signup.spec.ts:73` | 2 |
| VAL-205 | Unit | `tests/unit/validation.test.ts:166` | 3 |
| VAL-206 | Unit | `tests/unit/validation.test.ts:188` | 7 |
| VAL-207 | Unit | `tests/unit/validation.test.ts:219` | 3 |
| VAL-208 | Unit | `tests/unit/validation.test.ts:234` | 7 |
| VAL-208 | E2E | `tests/e2e/signup.spec.ts:27` | 3 |
| VAL-209 | Unit | `tests/unit/validation.test.ts:166` | 3 |
| VAL-210 | Unit | `tests/unit/validation.test.ts:278` | 7 |
| PERF-404 | Integration | `tests/integration/account.test.ts:66` | 1 |
| PERF-405 | Integration | `tests/integration/account.test.ts:85` | 1 |
| PERF-406 | Unit | `tests/unit/performance.test.ts:9` | 6 |
| PERF-406 | Integration | `tests/integration/account.test.ts:103` | 1 |


### Architecture

```
tests/
├── setup.ts              # Vitest global setup
├── helpers/
│   └── testDb.ts         # In-memory SQLite helper
├── unit/
│   ├── crypto.test.ts    # Pure function tests
│   ├── validation.test.ts
│   ├── security.test.ts
│   └── performance.test.ts
├── integration/
│   ├── auth.test.ts      # Tests with test database
│   └── account.test.ts
└── e2e/
    ├── home.spec.ts      # Browser automation tests
    ├── login.spec.ts
    └── signup.spec.ts
```

### Configuration Files

- `vitest.config.ts` - Unit/integration test configuration
- `playwright.config.ts` - E2E test configuration with auto dev server
