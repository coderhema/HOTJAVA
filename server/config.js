import path from 'node:path';

const rootDir = process.cwd();
const dataDir = path.resolve(rootDir, 'server/data');

export const config = {
  port: Number(process.env.PORT || 8787),
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqApiUrl: process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions',
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  dbPath: process.env.SQLITE_DB_PATH || path.resolve(dataDir, 'hotjava.sqlite'),
  backupDir: process.env.SQLITE_BACKUP_DIR || path.resolve(dataDir, 'backups'),
  backupIntervalMs: Number(process.env.SQLITE_BACKUP_INTERVAL_MS || 5 * 60 * 1000),
  backupRetention: Number(process.env.SQLITE_BACKUP_RETENTION || 12),
  slowQueryMs: Number(process.env.SQLITE_SLOW_QUERY_MS || 75),
};
