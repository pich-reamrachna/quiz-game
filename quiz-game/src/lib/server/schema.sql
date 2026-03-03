CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_sessions (
    id TEXT PRIMARY KEY,
    player_name TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    current_question_index INTEGER DEFAULT 0,
    started_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    status TEXT DEFAULT 'active', -- 'active', 'finished', 'expired'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
