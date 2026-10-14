CREATE TABLE projects (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, repository TEXT,
 instructions TEXT NOT NULL DEFAULT '', memory TEXT NOT NULL DEFAULT '',
 version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
ALTER TABLE conversations ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE RESTRICT DEFAULT NULL;
CREATE INDEX conversations_project ON conversations(project_id,pinned DESC,updated_at DESC);
CREATE INDEX projects_recent ON projects(updated_at DESC,id);
CREATE TRIGGER conversation_project_immutable BEFORE UPDATE OF project_id ON conversations
WHEN NEW.project_id IS NOT OLD.project_id BEGIN
 SELECT RAISE(ABORT,'Conversation project cannot change');
END;
