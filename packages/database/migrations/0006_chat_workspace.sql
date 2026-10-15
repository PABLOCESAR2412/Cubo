CREATE TABLE owner_sessions (id TEXT PRIMARY KEY, created_at TEXT NOT NULL);
CREATE TABLE provider_keys (id TEXT PRIMARY KEY, provider TEXT NOT NULL UNIQUE CHECK(provider='openrouter'), ciphertext TEXT NOT NULL, iv TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE app_settings (id TEXT PRIMARY KEY, value TEXT NOT NULL);
ALTER TABLE chat_messages ADD COLUMN attachments TEXT NOT NULL DEFAULT '[]';
