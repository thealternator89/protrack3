-- Up
ALTER TABLE Task ADD COLUMN Effort REAL;

-- Down
-- SQLite doesn't support dropping columns easily.
