-- One row per person currently in a lobby (SALLE-06). The primary key on user_id is what guarantees a person is
-- in one lobby at most; lobbies themselves live in the app's memory, so the table is cleared when the app starts.
CREATE TABLE lobby_members (
  user_id uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  lobby_code text NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now()
);
