-- Cubo: añadir columna indexada project_id a tasks para evitar full table scans de json_extract
ALTER TABLE tasks ADD COLUMN project_id TEXT;

UPDATE tasks SET project_id = json_extract(input, '$.projectId') WHERE json_extract(input, '$.projectId') IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_project_id_created_at ON tasks(project_id, created_at DESC);
