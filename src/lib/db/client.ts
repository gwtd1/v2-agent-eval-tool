import Database from 'better-sqlite3';
import path from 'path';
import { SCHEMA } from './schema';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'evaluations.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.exec(SCHEMA);
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Execute a function within a database transaction.
 * All database operations within the function will be atomic -
 * either all succeed or all are rolled back.
 */
export function withTransaction<T>(fn: () => T): T {
  const db = getDb();
  return db.transaction(fn)();
}
