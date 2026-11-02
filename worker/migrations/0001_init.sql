-- BraveLife 账号与云存档
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE COLLATE NOCASE,
  email TEXT UNIQUE COLLATE NOCASE,
  pw_hash TEXT,
  pw_salt TEXT,
  wx_openid TEXT UNIQUE,
  settings TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

-- 只存令牌的 SHA-256，数据库泄露也拿不到可用的令牌
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);

CREATE TABLE IF NOT EXISTS email_codes (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at INTEGER NOT NULL
);

-- slot：auto（自动存档）或 1、2、3（手动存档位）
CREATE TABLE IF NOT EXISTS saves (
  user_id INTEGER NOT NULL,
  slot TEXT NOT NULL,
  data TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, slot)
);

-- 服务器下发的游戏数值配置（key = 'game'）
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
