import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { logError, logInfo } from '../logger.js';

let timer = null;

const keepLatestBackups = () => {
  const files = fs
    .readdirSync(config.backupDir)
    .filter((name) => name.endsWith('.sqlite'))
    .sort()
    .reverse();

  const outdated = files.slice(config.backupRetention);
  for (const file of outdated) {
    fs.unlinkSync(path.join(config.backupDir, file));
  }
};

const runBackup = () => {
  try {
    fs.mkdirSync(config.backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const targetPath = path.join(config.backupDir, `hotjava-${timestamp}.sqlite`);
    fs.copyFileSync(config.dbPath, targetPath);
    keepLatestBackups();
    logInfo('db.backup_created', { targetPath });
  } catch (error) {
    logError('db.backup_failed', {
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

export const startBackupScheduler = () => {
  runBackup();
  timer = setInterval(runBackup, config.backupIntervalMs);
  timer.unref();
};

export const stopBackupScheduler = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};
