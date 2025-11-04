-- Drop legacy tables that are no longer needed
-- Keep only Auth.js compatible tables: user, account, session, verification_token

DROP TABLE IF EXISTS "password_reset_tokens" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "verification_tokens" CASCADE;

