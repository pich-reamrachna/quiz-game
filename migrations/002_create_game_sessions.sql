-- 002_create_game_sessions.sql
-- Server-authoritative game session state
CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'playing'
    CHECK (status IN ('playing', 'finished')),

  score INTEGER NOT NULL DEFAULT 0,
  question_index INTEGER NOT NULL DEFAULT 0,
  question_order_json TEXT NOT NULL,
  choice_order_json TEXT NOT NULL,

  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  finished_at TEXT,
  score_saved INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_expires_at ON game_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_game_sessions_player_name ON game_sessions(player_name);
