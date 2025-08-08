-- Database initialization script for Timesheet Management System

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create database if it doesn't exist (this will be handled by Docker)
-- CREATE DATABASE IF NOT EXISTS timesheet_db;

-- Grant privileges (handled by Docker environment variables)
-- GRANT ALL PRIVILEGES ON DATABASE timesheet_db TO timesheet_user;

-- Create schema if needed
-- CREATE SCHEMA IF NOT EXISTS public;

-- Set search path
SET search_path TO public;

-- Create custom types (these will be created by Prisma)
-- The actual table creation will be handled by Prisma migrations

-- Add any additional database configuration here
ALTER DATABASE timesheet_db SET timezone TO 'UTC';
ALTER DATABASE timesheet_db SET datestyle TO 'ISO, MDY';

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully';
END $$;
