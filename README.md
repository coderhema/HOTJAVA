# HOTJAVA

HOTJAVA is a React + Vite coding challenge game with a Node/Express backend and SQLite persistence.

## What is persisted in SQLite

The backend stores:
- `users` (host/guest identities)
- `sessions` (room/topic/mode lifecycle)
- `challenges` and `session_challenges` (generated challenge sets linked to sessions)
- `results` (XP/hearts/correct answers/streak)
- `event_logs` (structured app/server events)
- `schema_migrations` (migration/version tracking)

Schema migration files are in `server/db/migrations`.

## Reliability and monitoring

SQLite is configured with:
- WAL journal mode
- foreign keys ON
- busy timeout
- synchronous NORMAL

Monitoring includes:
- structured JSON request/query/error logs
- slow-query warnings (threshold configurable)
- health endpoint: `GET /api/health`
- startup integrity check: `PRAGMA integrity_check`

## Backups and restore

Backups are periodic SQLite file snapshots in:
- default: `server/data/backups`

Environment variables:
- `SQLITE_DB_PATH` (default `server/data/hotjava.sqlite`)
- `SQLITE_BACKUP_DIR`
- `SQLITE_BACKUP_INTERVAL_MS` (default 300000)
- `SQLITE_BACKUP_RETENTION` (default 12)
- `SQLITE_SLOW_QUERY_MS` (default 75)

Restore procedure:
1. Stop the backend server.
2. Copy a backup from `server/data/backups/*.sqlite` to the configured DB path.
3. Restart the server (migrations and integrity checks run at startup).

## Run locally

1. Install dependencies:
   - `npm ci`
2. Start backend:
   - `npm run server`
3. In another terminal, start frontend:
   - `npm run dev`

The Vite dev server proxies `/api/*` to `http://localhost:8787`.

## Build

- `npm run build`
