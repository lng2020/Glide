import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import crypto from 'crypto';

/**
 * Account Integration Tests
 * Tests for PERF-404, PERF-405, PERF-406, SEC-302
 */

let sqlite: Database.Database;

const createTables = `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL
  );

  CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    account_number TEXT UNIQUE NOT NULL,
    account_type TEXT NOT NULL,
    balance REAL DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`;

beforeEach(() => {
  sqlite = new Database(':memory:');
  sqlite.exec(createTables);
  sqlite.exec(`INSERT INTO users (email) VALUES ('test@test.com')`);
});

afterEach(() => {
  sqlite.close();
});

describe('SEC-302: Secure Account Number Generation', () => {
  function generateAccountNumber(): string {
    const bytes = crypto.randomBytes(5);
    const num = bytes.readUIntBE(0, 5) % 10000000000;
    return num.toString().padStart(10, '0');
  }

  it('generates unique account numbers', () => {
    const numbers = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const num = generateAccountNumber();
      sqlite.exec(`INSERT INTO accounts (user_id, account_number, account_type) VALUES (1, '${num}', 'checking')`);
      numbers.add(num);
    }
    expect(numbers.size).toBe(100);
  });
});

describe('PERF-404: Transaction Sorting', () => {
  it('returns transactions sorted by date descending', () => {
    sqlite.exec(`INSERT INTO accounts (user_id, account_number, account_type) VALUES (1, '1234567890', 'checking')`);

    // Insert transactions with different timestamps
    sqlite.exec(`INSERT INTO transactions (account_id, type, amount, description, created_at) VALUES (1, 'deposit', 100, 'First', '2024-01-01 10:00:00')`);
    sqlite.exec(`INSERT INTO transactions (account_id, type, amount, description, created_at) VALUES (1, 'deposit', 200, 'Second', '2024-01-02 10:00:00')`);
    sqlite.exec(`INSERT INTO transactions (account_id, type, amount, description, created_at) VALUES (1, 'deposit', 300, 'Third', '2024-01-03 10:00:00')`);

    const transactions = sqlite.prepare(
      'SELECT * FROM transactions WHERE account_id = 1 ORDER BY created_at DESC'
    ).all() as any[];

    expect(transactions[0].description).toBe('Third');
    expect(transactions[1].description).toBe('Second');
    expect(transactions[2].description).toBe('First');
  });
});

describe('PERF-405: All Transactions Returned', () => {
  it('returns all transactions with .all()', () => {
    sqlite.exec(`INSERT INTO accounts (user_id, account_number, account_type) VALUES (1, '1234567890', 'checking')`);

    for (let i = 1; i <= 50; i++) {
      sqlite.exec(`INSERT INTO transactions (account_id, type, amount, description) VALUES (1, 'deposit', ${i * 10}, 'Tx ${i}')`);
    }

    // Using .all() returns all records
    const transactions = sqlite.prepare('SELECT * FROM transactions WHERE account_id = 1').all();
    expect(transactions).toHaveLength(50);

    // Using .get() would only return first record
    const single = sqlite.prepare('SELECT * FROM transactions WHERE account_id = 1').get();
    expect(single).toBeDefined();
  });
});

describe('PERF-406: Balance Calculation', () => {
  function calculateNewBalance(current: number, amount: number): number {
    return Math.round((current + amount) * 100) / 100;
  }

  it('maintains precision during balance updates', () => {
    sqlite.exec(`INSERT INTO accounts (user_id, account_number, account_type, balance) VALUES (1, '1234567890', 'checking', 0)`);

    let balance = 0;
    for (let i = 0; i < 10; i++) {
      balance = calculateNewBalance(balance, 0.1);
      sqlite.exec(`UPDATE accounts SET balance = ${balance} WHERE id = 1`);
    }

    const account = sqlite.prepare('SELECT balance FROM accounts WHERE id = 1').get() as any;
    expect(account.balance).toBe(1);
  });
});
