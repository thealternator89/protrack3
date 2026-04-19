-- Up
CREATE UNIQUE INDEX idx_project_prefix ON Project(Prefix COLLATE NOCASE);

-- Down
DROP INDEX idx_project_prefix;
