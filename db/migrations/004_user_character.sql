-- Character a player races as. Allowed values are checked by the app, so adding a character needs no migration.
ALTER TABLE users ADD COLUMN character_id text NOT NULL DEFAULT 'joker';
