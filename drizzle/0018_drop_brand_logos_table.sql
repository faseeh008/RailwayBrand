-- 0018_drop_brand_logos_table.sql
-- Drop brand_logos table - logos are now stored in brand_guidelines.logoData and logoFiles

DROP TABLE IF EXISTS brand_logos CASCADE;

