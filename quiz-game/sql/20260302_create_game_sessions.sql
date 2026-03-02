CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  question_index INTEGER NOT NULL DEFAULT 0,
  question_order TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  finished INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_finished ON game_sessions (finished);
CREATE INDEX IF NOT EXISTS idx_game_sessions_expires_at ON game_sessions (expires_at);
