import express from 'express';
import { config } from './config.js';
import { logError, logInfo } from './logger.js';
import { runMigrations } from './db/migrate.js';
import { seedInitialData } from './db/seed.js';
import { integrityCheck } from './db/client.js';
import { startBackupScheduler, stopBackupScheduler } from './db/backup.js';
import { getDbMetrics } from './db/monitor.js';
import {
  createSession,
  createUser,
  findSession,
  getSessionChallenges,
  getSessionSummary,
  replaceSessionChallenges,
  saveEvent,
  saveResult,
} from './repositories/sessionRepository.js';
import { generateChallenges, stringToSeed } from './services/challengeService.js';

runMigrations();
seedInitialData();

const integrity = integrityCheck();
if (integrity !== 'ok') {
  throw new Error(`SQLite integrity check failed: ${integrity}`);
}

startBackupScheduler();

const app = express();
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  const start = performance.now();
  res.on('finish', () => {
    const durationMs = Number((performance.now() - start).toFixed(2));
    logInfo('http.request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs,
    });
  });
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    integrity: integrityCheck(),
    dbMetrics: getDbMetrics(),
    backup: {
      path: config.backupDir,
      intervalMs: config.backupIntervalMs,
      retention: config.backupRetention,
    },
  });
});

app.post('/api/sessions/start', async (req, res) => {
  try {
    const { topic, roomCode, mode, sessionType, challengeCount = 5 } = req.body || {};
    const normalizedTopic = String(topic || '').trim();
    const normalizedRoomCode = String(roomCode || '').trim().toUpperCase();
    const normalizedMode = String(mode || 'FILL_GAPS').trim();
    const normalizedSessionType = String(sessionType || 'HOST').trim();

    if (!normalizedTopic || !normalizedRoomCode) {
      return res.status(400).json({ error: 'topic and roomCode are required' });
    }

    const userId = crypto.randomUUID();
    const userName = normalizedSessionType === 'HOST' ? `Host-${normalizedRoomCode}` : `Guest-${normalizedRoomCode}`;
    createUser({ id: userId, name: userName });

    let session = findSession({ roomCode: normalizedRoomCode, topic: normalizedTopic });
    if (!session) {
      session = createSession({
        id: crypto.randomUUID(),
        roomCode: normalizedRoomCode,
        topic: normalizedTopic,
        mode: normalizedMode,
        hostUserId: userId,
      });
    }

    let challenges = getSessionChallenges(session.id);

    if (challenges.length === 0 || normalizedSessionType === 'HOST') {
      const seed = stringToSeed(normalizedRoomCode);
      challenges = await generateChallenges({
        topic: normalizedTopic,
        count: Number(challengeCount) || 5,
        seed,
        config,
      });
      replaceSessionChallenges({ sessionId: session.id, challenges });
    }

    saveEvent({
      id: crypto.randomUUID(),
      sessionId: session.id,
      userId,
      level: 'info',
      eventType: 'session.start',
      message: `Session ${normalizedSessionType.toLowerCase()} request`,
      metadataJson: JSON.stringify({ mode: normalizedMode, challengeCount: challenges.length }),
    });

    const summary = getSessionSummary(session.id);

    return res.json({
      sessionId: session.id,
      userId,
      roomCode: normalizedRoomCode,
      topic: normalizedTopic,
      mode: normalizedMode,
      challenges,
      summary,
    });
  } catch (error) {
    logError('api.sessions.start_failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ error: 'Failed to start session' });
  }
});

app.post('/api/sessions/:sessionId/result', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId, xp, heartsRemaining, correctAnswers, totalAnswers, streakMax } = req.body || {};

    if (!sessionId || !userId) {
      return res.status(400).json({ error: 'sessionId and userId are required' });
    }

    saveResult({
      id: crypto.randomUUID(),
      sessionId,
      userId,
      xp: Number(xp) || 0,
      heartsRemaining: Number(heartsRemaining) || 0,
      correctAnswers: Number(correctAnswers) || 0,
      totalAnswers: Number(totalAnswers) || 0,
      streakMax: Number(streakMax) || 0,
    });

    saveEvent({
      id: crypto.randomUUID(),
      sessionId,
      userId,
      level: 'info',
      eventType: 'session.result',
      message: 'Session result submitted',
      metadataJson: JSON.stringify({ xp, heartsRemaining, correctAnswers, totalAnswers, streakMax }),
    });

    return res.status(201).json({ status: 'saved' });
  } catch (error) {
    logError('api.sessions.result_failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ error: 'Failed to save result' });
  }
});

app.post('/api/events', (req, res) => {
  try {
    const { sessionId = null, userId = null, level = 'info', eventType = 'client.event', message = '', metadata = {} } = req.body || {};
    saveEvent({
      id: crypto.randomUUID(),
      sessionId,
      userId,
      level,
      eventType,
      message: String(message || ''),
      metadataJson: JSON.stringify(metadata),
    });

    return res.status(201).json({ status: 'logged' });
  } catch (error) {
    logError('api.events.failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ error: 'Failed to log event' });
  }
});

const server = app.listen(config.port, () => {
  logInfo('server.started', { port: config.port });
});

const shutdown = () => {
  stopBackupScheduler();
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
