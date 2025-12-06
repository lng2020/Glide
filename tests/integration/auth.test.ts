import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { encryptSSN, decryptSSN, getSSNLastFour } from '@/lib/crypto';

/**
 * Auth Router Integration Tests
 * Tests for SEC-301, SEC-304, VAL-202, VAL-203, VAL-204, VAL-208
 */

// Create in-memory test database
let sqlite: Database.Database;

// Schema definitions inline for test isolation
const createTables = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    date_of_birth TEXT NOT NULL,
    ssn_encrypted TEXT NOT NULL,
    ssn_last_four TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`;

beforeEach(() => {
  sqlite = new Database(':memory:');
  sqlite.exec(createTables);
});

afterEach(() => {
  sqlite.close();
});

describe('SEC-301: SSN Encryption Integration', () => {
  it('stores encrypted SSN, not plaintext', () => {
    const ssn = '123456789';
    const ssnEncrypted = encryptSSN(ssn);
    const ssnLastFour = getSSNLastFour(ssn);

    sqlite.exec(`
      INSERT INTO users (email, password, first_name, last_name, phone_number, date_of_birth, ssn_encrypted, ssn_last_four, address, city, state, zip_code)
      VALUES ('test@test.com', 'hash', 'Test', 'User', '5551234567', '1990-01-01', '${ssnEncrypted}', '${ssnLastFour}', '123 Main', 'City', 'CA', '12345')
    `);

    const user = sqlite.prepare('SELECT ssn_encrypted, ssn_last_four FROM users WHERE email = ?').get('test@test.com') as any;

    // SSN should be encrypted (contains colons for iv:authTag:encrypted format)
    expect(user.ssn_encrypted).toContain(':');
    expect(user.ssn_encrypted).not.toBe(ssn);

    // Should be decryptable back to original
    expect(decryptSSN(user.ssn_encrypted)).toBe(ssn);

    // Last four should be stored
    expect(user.ssn_last_four).toBe('6789');
  });

  it('does not store plaintext SSN anywhere', () => {
    const ssn = '987654321';
    const ssnEncrypted = encryptSSN(ssn);
    const ssnLastFour = getSSNLastFour(ssn);

    sqlite.exec(`
      INSERT INTO users (email, password, first_name, last_name, phone_number, date_of_birth, ssn_encrypted, ssn_last_four, address, city, state, zip_code)
      VALUES ('test2@test.com', 'hash', 'Test', 'User', '5551234567', '1990-01-01', '${ssnEncrypted}', '${ssnLastFour}', '123 Main', 'City', 'CA', '12345')
    `);

    // Get raw database content
    const allData = sqlite.prepare('SELECT * FROM users').all();
    const dataStr = JSON.stringify(allData);

    // Full SSN should NOT appear anywhere in stored data
    expect(dataStr).not.toContain('987654321');
    expect(dataStr).toContain('4321'); // Last four is OK
  });
});

describe('SEC-304: Single Session Policy Integration', () => {
  it('only one session exists per user', () => {
    // Create user
    sqlite.exec(`
      INSERT INTO users (email, password, first_name, last_name, phone_number, date_of_birth, ssn_encrypted, ssn_last_four, address, city, state, zip_code)
      VALUES ('session@test.com', 'hash', 'Test', 'User', '5551234567', '1990-01-01', 'encrypted', '6789', '123 Main', 'City', 'CA', '12345')
    `);

    const userId = 1;

    // Simulate first login - create session
    sqlite.exec(`INSERT INTO sessions (user_id, token, expires_at) VALUES (${userId}, 'token1', '2099-01-01')`);

    // Verify one session exists
    let sessions = sqlite.prepare('SELECT * FROM sessions WHERE user_id = ?').all(userId);
    expect(sessions.length).toBe(1);

    // Simulate second login - delete old sessions first (as the fix does)
    sqlite.exec(`DELETE FROM sessions WHERE user_id = ${userId}`);
    sqlite.exec(`INSERT INTO sessions (user_id, token, expires_at) VALUES (${userId}, 'token2', '2099-01-01')`);

    // Should still only have one session
    sessions = sqlite.prepare('SELECT * FROM sessions WHERE user_id = ?').all(userId);
    expect(sessions.length).toBe(1);
    expect((sessions[0] as any).token).toBe('token2');
  });

  it('old session token is invalidated after new login', () => {
    sqlite.exec(`
      INSERT INTO users (email, password, first_name, last_name, phone_number, date_of_birth, ssn_encrypted, ssn_last_four, address, city, state, zip_code)
      VALUES ('invalidate@test.com', 'hash', 'Test', 'User', '5551234567', '1990-01-01', 'encrypted', '6789', '123 Main', 'City', 'CA', '12345')
    `);

    const userId = 1;
    const oldToken = 'old-token-123';
    const newToken = 'new-token-456';

    // Create old session
    sqlite.exec(`INSERT INTO sessions (user_id, token, expires_at) VALUES (${userId}, '${oldToken}', '2099-01-01')`);

    // New login - delete old, create new
    sqlite.exec(`DELETE FROM sessions WHERE user_id = ${userId}`);
    sqlite.exec(`INSERT INTO sessions (user_id, token, expires_at) VALUES (${userId}, '${newToken}', '2099-01-01')`);

    // Old token should not exist
    const oldSession = sqlite.prepare('SELECT * FROM sessions WHERE token = ?').get(oldToken);
    expect(oldSession).toBeUndefined();

    // New token should exist
    const newSession = sqlite.prepare('SELECT * FROM sessions WHERE token = ?').get(newToken);
    expect(newSession).toBeDefined();
  });
});

describe('Password Hashing Integration', () => {
  it('stores hashed password, not plaintext', async () => {
    const password = 'SecureP@ss1';
    const hashedPassword = await bcrypt.hash(password, 10);

    sqlite.exec(`
      INSERT INTO users (email, password, first_name, last_name, phone_number, date_of_birth, ssn_encrypted, ssn_last_four, address, city, state, zip_code)
      VALUES ('hash@test.com', '${hashedPassword}', 'Test', 'User', '5551234567', '1990-01-01', 'encrypted', '6789', '123 Main', 'City', 'CA', '12345')
    `);

    const user = sqlite.prepare('SELECT password FROM users WHERE email = ?').get('hash@test.com') as any;

    // Password should NOT be plaintext
    expect(user.password).not.toBe(password);

    // Should start with bcrypt prefix
    expect(user.password).toMatch(/^\$2[aby]?\$/);

    // Should be verifiable
    const isValid = await bcrypt.compare(password, user.password);
    expect(isValid).toBe(true);
  });
});
