CREATE TABLE conversations (
 id TEXT PRIMARY KEY, title TEXT NOT NULL, pinned INTEGER NOT NULL DEFAULT 0 CHECK(pinned IN (0,1)),
 version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE chat_messages (
 id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
 sequence INTEGER NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL,
 UNIQUE(conversation_id,sequence)
);
CREATE INDEX conversations_recent ON conversations(pinned DESC,updated_at DESC);
CREATE INDEX messages_conversation ON chat_messages(conversation_id,sequence);
CREATE TRIGGER chat_message_inserted AFTER INSERT ON chat_messages BEGIN
 UPDATE conversations SET version=version+1,updated_at=NEW.created_at WHERE id=NEW.conversation_id;
END;
