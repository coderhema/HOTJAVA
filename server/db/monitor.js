import { logError, logWarn } from '../logger.js';

const metrics = {
  startedAt: new Date().toISOString(),
  queryCount: 0,
  slowQueryCount: 0,
  errorCount: 0,
  lastSlowQuery: null,
  lastError: null,
};

export const recordQuery = ({ sql, durationMs, thresholdMs }) => {
  metrics.queryCount += 1;
  if (durationMs >= thresholdMs) {
    metrics.slowQueryCount += 1;
    metrics.lastSlowQuery = {
      sql: sql.slice(0, 160),
      durationMs,
      at: new Date().toISOString(),
    };
    logWarn('db.slow_query', { durationMs, thresholdMs, sql: sql.slice(0, 160) });
  }
};

export const recordDbError = ({ sql, error }) => {
  metrics.errorCount += 1;
  metrics.lastError = {
    sql: sql.slice(0, 160),
    message: error instanceof Error ? error.message : String(error),
    at: new Date().toISOString(),
  };
  logError('db.query_error', metrics.lastError);
};

export const getDbMetrics = () => ({ ...metrics });
