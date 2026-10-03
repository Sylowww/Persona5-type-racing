-- One row per registered player per finished race: their history and the
-- source of their stats. Guests keep their races in the browser instead.
CREATE TABLE race_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  lobby_code text NOT NULL,
  ended_at timestamptz NOT NULL,
  place integer NOT NULL CHECK (place >= 1),
  racer_count integer NOT NULL CHECK (racer_count >= place),
  wpm double precision NOT NULL CHECK (wpm >= 0),
  accuracy double precision NOT NULL CHECK (accuracy >= 0 AND accuracy <= 1),
  -- Null when the player did not finish the text.
  finish_ms integer CHECK (finish_ms >= 0),
  duration_ms integer NOT NULL CHECK (duration_ms >= 0),
  keystrokes integer NOT NULL CHECK (keystrokes >= 0),
  mistakes integer NOT NULL CHECK (mistakes >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lobby_code, ended_at)
);
CREATE INDEX race_results_user_ended_idx ON race_results (user_id, ended_at DESC);
