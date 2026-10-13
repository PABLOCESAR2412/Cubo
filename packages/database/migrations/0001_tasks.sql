PRAGMA foreign_keys = ON;
CREATE TABLE tasks (
 id TEXT PRIMARY KEY, title TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('QUEUED','RUNNING','WAITING_APPROVAL','SUCCEEDED','FAILED','CANCELLED')),
 input TEXT NOT NULL, execution_id TEXT NOT NULL, attempt INTEGER NOT NULL DEFAULT 1,
 progress INTEGER NOT NULL DEFAULT 0, version INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, error TEXT, result TEXT
);
CREATE TABLE executions (
 id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(id), backend TEXT NOT NULL,
 backend_run_id TEXT, status TEXT NOT NULL, created_at TEXT NOT NULL, dispatched INTEGER NOT NULL DEFAULT 0,
 workflow_created INTEGER NOT NULL DEFAULT 0,
 orchestration_attempt INTEGER NOT NULL DEFAULT 0, retry_after TEXT
);
CREATE TABLE checkpoints (
 execution_id TEXT NOT NULL REFERENCES executions(id), sequence INTEGER NOT NULL,
 task_id TEXT NOT NULL REFERENCES tasks(id), cursor INTEGER NOT NULL, sum INTEGER NOT NULL,
 digest TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(execution_id,sequence)
);
CREATE TABLE task_events (
 id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(id), execution_id TEXT NOT NULL REFERENCES executions(id),
 sequence INTEGER NOT NULL, type TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE approvals (
 id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(id), execution_id TEXT NOT NULL REFERENCES executions(id),
 action TEXT NOT NULL, checkpoint_digest TEXT NOT NULL, status TEXT NOT NULL,
 created_at TEXT NOT NULL, decided_at TEXT
);
CREATE TABLE login_limits (id TEXT PRIMARY KEY, window INTEGER NOT NULL, hits INTEGER NOT NULL);
CREATE INDEX tasks_created ON tasks(created_at DESC);
CREATE INDEX checkpoints_latest ON checkpoints(task_id,created_at DESC,sequence DESC);
CREATE INDEX execution_outbox ON executions(workflow_created,status);
CREATE INDEX events_task ON task_events(task_id,created_at,sequence);

