-- Cubo: ampliar restricción CHECK de proveedores para admitir openrouter, gemini, groq y nvidia

CREATE TABLE provider_keys_new (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL UNIQUE CHECK(provider IN ('openrouter', 'gemini', 'groq', 'nvidia')),
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at TEXT NOT NULL
);

INSERT INTO provider_keys_new (id, provider, ciphertext, iv, created_at)
SELECT id, provider, ciphertext, iv, created_at FROM provider_keys;

DROP TABLE provider_keys;

ALTER TABLE provider_keys_new RENAME TO provider_keys;

CREATE TABLE project_provider_keys_new (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL CHECK(provider IN ('openrouter', 'gemini', 'groq', 'nvidia')),
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(project_id, provider)
);

INSERT INTO project_provider_keys_new (id, project_id, provider, ciphertext, iv, created_at)
SELECT id, project_id, provider, ciphertext, iv, created_at FROM project_provider_keys;

DROP TABLE project_provider_keys;

ALTER TABLE project_provider_keys_new RENAME TO project_provider_keys;
