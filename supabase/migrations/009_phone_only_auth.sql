-- ================================================
-- Migration 009: Relax NOT NULL constraints on users table
-- to support phone-only authentication flow.
-- Existing users with data are unaffected.
-- ================================================

-- Allow name to be NULL (or empty string) for phone-only users
ALTER TABLE users ALTER COLUMN name DROP NOT NULL;

-- Allow surname to be NULL (or empty string) for phone-only users
ALTER TABLE users ALTER COLUMN surname DROP NOT NULL;

-- Allow password_hash to be NULL (or empty string) for phone-only users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
