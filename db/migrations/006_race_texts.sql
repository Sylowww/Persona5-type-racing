-- Corpus of coherent race texts (CONF-03), filled by `npm run db:seed`.
CREATE TABLE race_texts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language text NOT NULL CHECK (language IN ('fr', 'en')),
  body text NOT NULL UNIQUE,
  -- True when the text contains digits, for the "numbers" race setting.
  has_numbers boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX race_texts_language_idx ON race_texts (language, has_numbers);
