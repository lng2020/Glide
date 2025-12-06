/**
 * Test Database Helper
 * Creates an in-memory SQLite database for integration tests
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { encryptSSN, getSSNLastFour } from '@/lib/crypto';

export function createTestDb() {
  const sqlite = new Database(':memory:');

  // Create tables
  sqlite.exec(`
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

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      account_number TEXT UNIQUE NOT NULL,
      account_type TEXT NOT NULL,
      balance REAL DEFAULT 0 NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL REFERENCES accounts(id),
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending' NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      processed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return drizzle(sqlite);
}

export function seedTestUser(db: ReturnType<typeof createTestDb>) {
  const hashedPassword = bcrypt.hashSync('TestPass1!', 10);
  const ssnEncrypted = encryptSSN('123456789');
  const ssnLastFour = getSSNLastFour('123456789');

  db.run(sql`
    INSERT INTO users (email, password, first_name, last_name, phone_number, date_of_birth, ssn_encrypted, ssn_last_four, address, city, state, zip_code)
    VALUES ('test@example.com', ${hashedPassword}, 'Test', 'User', '5551234567', '1990-01-01', ${ssnEncrypted}, ${ssnLastFour}, '123 Main St', 'Anytown', 'CA', '12345')
  `);

  return {
    email: 'test@example.com',
    password: 'TestPass1!',
    userId: 1,
  };
}
