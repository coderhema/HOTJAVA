import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { config } from '../config.js';
import { logInfo } from '../logger.js';
import { recordDbError, recordQuery } from './monitor.js';

const dbDir = path.dirname(config.dbPath);
fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(config.dbPath);

const pragmas = [
  'journal_mode = WAL',
  'foreign_keys = ON',
  'busy_timeout = 5000',
  'synchronous = NORMAL',
  'temp_store = MEMORY',
];

for (const pragma of pragmas) {
  db.pragma(pragma);
}

const timed = (sql, fn) => {
  const start = performance.now();
  try {
    return fn();
  } catch (error) {
    recordDbError({ sql, error });
    throw error;
  } finally {
    recordQuery({ sql, durationMs: Number((performance.now() - start).toFixed(2)), thresholdMs: config.slowQueryMs });
  }
};

export const run = (sql, params = {}) => timed(sql, () => db.prepare(sql).run(params));
export const get = (sql, params = {}) => timed(sql, () => db.prepare(sql).get(params));
export const all = (sql, params = {}) => timed(sql, () => db.prepare(sql).all(params));
export const exec = (sql) => timed(sql, () => db.exec(sql));
export const transaction = (fn) => db.transaction(fn);

export const integrityCheck = () => {
  const row = get('PRAGMA integrity_check;');
  return row?.integrity_check || 'unknown';
};

export const closeDb = () => db.close();

logInfo('db.connected', { dbPath: config.dbPath });
