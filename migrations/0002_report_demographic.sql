-- Snapshot demographic used for scoring at save time.
-- SECURITY: still always filter reports by user_id in application code.
ALTER TABLE reports ADD COLUMN demographic_sex TEXT;
ALTER TABLE reports ADD COLUMN demographic_age_years INTEGER;
