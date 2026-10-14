-- Migration: make email the primary identifier, phone optional.
--
-- Run this against the existing database AFTER confirming every row already
-- has a non-null, unique email (the app used to require phone, not email, so
-- some rows may still be missing one). If any row has a null email, this
-- migration will fail on step 2 — back-fill or remove those rows first, e.g.:
--
--   SELECT id, phone, email FROM users WHERE email IS NULL;
--
-- 1. Phone is no longer mandatory.
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;

-- 2. Email becomes mandatory (will fail if any row has a NULL email).
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
