-- Initialize the database with basic setup
-- This file runs when the PostgreSQL container starts for the first time

-- Create the main database (already created by POSTGRES_DB env var)
-- But we can add any additional setup here

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create any additional extensions if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Log successful initialization
SELECT 'Database initialized successfully for EternaBrand' as status;

