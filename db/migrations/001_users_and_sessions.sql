-- Users: registered accounts and guests share one table so races and stats
-- can reference either. A guest can later be upgraded to a registered account.
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('guest', 'registered')),
  username text NOT NULL,
  email text,
  password_hash text,
  avatar_url text,
  locale text NOT NULL DEFAULT 'fr' CHECK (locale IN ('fr', 'en')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  CHECK (kind = 'registered' OR (email IS NULL AND password_hash IS NULL))
);

-- Usernames and emails are unique case-insensitively among registered users.
-- Guest names (e.g. "Guest-4821") may repeat.
CREATE UNIQUE INDEX users_username_registered_key
  ON users (lower(username)) WHERE kind = 'registered';
CREATE UNIQUE INDEX users_email_key
  ON users (lower(email)) WHERE email IS NOT NULL;

-- OAuth identities (GitHub, Discord) linked to a registered user.
CREATE TABLE oauth_accounts (
  provider text NOT NULL CHECK (provider IN ('github', 'discord')),
  provider_account_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, provider_account_id)
);
CREATE INDEX oauth_accounts_user_id_idx ON oauth_accounts (user_id);

-- Sessions for guests and registered users. Only the SHA-256 hash of the
-- session token is stored; the raw token lives in the client cookie.
CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX sessions_user_id_idx ON sessions (user_id);
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);
