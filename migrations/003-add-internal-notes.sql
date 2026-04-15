-- Up
ALTER TABLE Task ADD COLUMN InternalNotes TEXT;

-- Down
-- SQLite doesn't support dropping columns easily.
