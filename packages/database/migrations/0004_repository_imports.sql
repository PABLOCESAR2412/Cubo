CREATE TABLE project_repository_keys (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE RESTRICT,
 public_key TEXT NOT NULL, fingerprint TEXT NOT NULL, ciphertext TEXT NOT NULL, iv TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE TABLE repository_snapshots (
 task_id TEXT PRIMARY KEY REFERENCES tasks(id), project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
 execution_id TEXT NOT NULL REFERENCES executions(id), sequence INTEGER NOT NULL,
 snapshot TEXT NOT NULL, digest TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX repository_snapshots_project ON repository_snapshots(project_id,created_at DESC);
CREATE TABLE execution_slot (slot INTEGER PRIMARY KEY CHECK(slot=1), execution_id TEXT REFERENCES executions(id));
INSERT INTO execution_slot(slot,execution_id) VALUES(1,NULL);
