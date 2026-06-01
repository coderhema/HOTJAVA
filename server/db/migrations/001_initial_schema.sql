CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  room_code TEXT NOT NULL,
  topic TEXT NOT NULL,
  mode TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  host_user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (host_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  description TEXT NOT NULL,
  code_with_gaps TEXT NOT NULL,
  full_solution TEXT NOT NULL,
  gap_answers_json TEXT NOT NULL,
  explanation TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS session_challenges (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  challenge_order INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
  UNIQUE (session_id, challenge_order)
);

CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  xp INTEGER NOT NULL,
  hearts_remaining INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  total_answers INTEGER NOT NULL,
  streak_max INTEGER NOT NULL,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS event_logs (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  user_id TEXT,
  level TEXT NOT NULL,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_room_topic ON sessions(room_code, topic);
CREATE INDEX IF NOT EXISTS idx_results_session_user ON results(session_id, user_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_session_created ON event_logs(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_session_challenges_session_order ON session_challenges(session_id, challenge_order);
