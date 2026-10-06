-- Profile pictures uploaded by registered users. Stored in the database so they
-- survive redeploys (the app server's disk is not persistent). users.avatar_url
-- points to the serving route, with a version segment so caches refresh on change.
CREATE TABLE user_avatars (
  user_id uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  data bytea NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
