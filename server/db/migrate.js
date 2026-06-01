import fs from 'node:fs';
import path from 'node:path';
import { all, run, exec } from './client.js';
import { logInfo } from '../logger.js';

const migrationsDir = path.resolve(process.cwd(), 'server/db/migrations');

const ensureMigrationsTable = () => {
  exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
};

export const runMigrations = () => {
  ensureMigrationsTable();
  const applied = new Set(all('SELECT name FROM schema_migrations').map((row) => row.name));
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    exec(sql);
    run('INSERT INTO schema_migrations (name) VALUES (@name);', { name: file });
    logInfo('db.migration_applied', { file });
  }
};
