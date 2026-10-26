-- The full results of each saved race, as the player saw them: every racer's line and WPM series (RES-05), so the
-- results page can be shown again from the history (HIST-02). Null for races saved before this column existed.
ALTER TABLE race_results ADD COLUMN result jsonb;
