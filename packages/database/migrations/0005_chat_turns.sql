ALTER TABLE chat_messages ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','assistant'));
-- Legacy writers omit this column: preserve uncertainty instead of claiming no dispatch.
ALTER TABLE executions ADD COLUMN dispatch_started INTEGER NOT NULL DEFAULT 1 CHECK(dispatch_started IN (0,1));
ALTER TABLE executions ADD COLUMN cancellation_requested INTEGER NOT NULL DEFAULT 0 CHECK(cancellation_requested IN (0,1));
CREATE TABLE project_provider_keys (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
 provider TEXT NOT NULL CHECK(provider='openrouter'), ciphertext TEXT NOT NULL, iv TEXT NOT NULL,
 created_at TEXT NOT NULL, UNIQUE(project_id,provider)
);
CREATE TABLE chat_turns (
 task_id TEXT PRIMARY KEY REFERENCES tasks(id), project_id TEXT NOT NULL REFERENCES projects(id),
 conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
 user_message_id TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
 context TEXT NOT NULL, result_digest TEXT, request_started INTEGER NOT NULL DEFAULT 0 CHECK(request_started IN (0,1)),
 UNIQUE(conversation_id,user_message_id)
);
CREATE INDEX chat_turns_conversation ON chat_turns(conversation_id);
CREATE TRIGGER chat_message_capacity BEFORE INSERT ON chat_messages WHEN NOT EXISTS(SELECT 1 FROM chat_messages WHERE id=NEW.id) AND (SELECT COUNT(*) FROM chat_messages WHERE conversation_id=NEW.conversation_id)>=200
BEGIN SELECT RAISE(ABORT,'Conversation message limit'); END;
CREATE TRIGGER chat_turn_capacity BEFORE INSERT ON chat_turns WHEN (SELECT COUNT(*) FROM chat_messages WHERE conversation_id=NEW.conversation_id)>199
BEGIN SELECT RAISE(ABORT,'Conversation response capacity'); END;
CREATE TRIGGER one_active_chat_turn BEFORE INSERT ON chat_turns WHEN EXISTS(
 SELECT 1 FROM chat_turns r JOIN tasks t ON t.id=r.task_id WHERE r.conversation_id=NEW.conversation_id AND t.id<>NEW.task_id AND t.status IN ('QUEUED','RUNNING')
) BEGIN SELECT RAISE(ABORT,'Chat already has an active turn'); END;
CREATE TRIGGER chat_turn_scope BEFORE INSERT ON chat_turns WHEN NOT EXISTS(
 SELECT 1 FROM conversations c JOIN chat_messages m ON m.conversation_id=c.id
 WHERE c.id=NEW.conversation_id AND c.project_id=NEW.project_id AND m.id=NEW.user_message_id AND m.role='user' AND m.content=json_extract(NEW.context,'$.messages[#-1].content')
) BEGIN SELECT RAISE(ABORT,'Chat turn scope mismatch'); END;
