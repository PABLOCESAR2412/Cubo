-- chat_turns.project_id deja de ser NOT NULL para que el chat libre (sin proyecto)
-- persista turnos como ya se admite en la UI y el esquema compartido. La tabla se
-- reconstruye porque SQLite no puede alterar la nulidad de una columna; los triggers
-- se vuelven a crear con comparación consciente de NULL (IS).
CREATE TABLE chat_turns_v2 (
  task_id TEXT PRIMARY KEY REFERENCES tasks(id),
  project_id TEXT REFERENCES projects(id) ON DELETE RESTRICT,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_message_id TEXT NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  context TEXT NOT NULL,
  result_digest TEXT,
  request_started INTEGER NOT NULL DEFAULT 0 CHECK(request_started IN (0,1)),
  UNIQUE(conversation_id,user_message_id)
);
INSERT INTO chat_turns_v2(task_id,project_id,conversation_id,user_message_id,context,result_digest,request_started)
SELECT task_id,project_id,conversation_id,user_message_id,context,result_digest,request_started FROM chat_turns;
DROP TABLE chat_turns;
ALTER TABLE chat_turns_v2 RENAME TO chat_turns;
CREATE INDEX chat_turns_conversation ON chat_turns(conversation_id);
CREATE TRIGGER chat_turn_capacity BEFORE INSERT ON chat_turns WHEN (SELECT COUNT(*) FROM chat_messages WHERE conversation_id=NEW.conversation_id)>199
BEGIN SELECT RAISE(ABORT,'Conversation response capacity'); END;
CREATE TRIGGER one_active_chat_turn BEFORE INSERT ON chat_turns WHEN EXISTS(
 SELECT 1 FROM chat_turns r JOIN tasks t ON t.id=r.task_id WHERE r.conversation_id=NEW.conversation_id AND t.id<>NEW.task_id AND t.status IN ('QUEUED','RUNNING')
) BEGIN SELECT RAISE(ABORT,'Chat already has an active turn'); END;
CREATE TRIGGER chat_turn_scope BEFORE INSERT ON chat_turns WHEN NOT EXISTS(
 SELECT 1 FROM conversations c JOIN chat_messages m ON m.conversation_id=c.id
 WHERE c.id=NEW.conversation_id AND c.project_id IS NEW.project_id AND m.id=NEW.user_message_id AND m.role='user' AND m.content=json_extract(NEW.context,'$.messages[#-1].content')
) BEGIN SELECT RAISE(ABORT,'Chat turn scope mismatch'); END;
