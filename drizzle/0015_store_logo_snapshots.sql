-- 0015_store_logo_snapshots.sql
-- Add a column to persist the latest accepted logo snapshot per chat session

ALTER TABLE brand_builder_chats
ADD COLUMN IF NOT EXISTS latest_logo_snapshot text;

