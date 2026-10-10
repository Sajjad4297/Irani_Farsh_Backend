-- =============================================================================
-- Shared PostgreSQL Provisioning Script for Irani-Farsh
-- Run this once on the shared Postgres container `db` at /opt/postgres:
-- docker compose exec -i db psql -U postgres < setup-database.sql
-- =============================================================================

-- 1. Create a dedicated database user
DO
$do$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'iranifarsh') THEN
      CREATE ROLE iranifarsh WITH LOGIN PASSWORD 'change_this_secure_password';
   END IF;
END
$do$;

-- 2. Create an isolated database owned by this user
SELECT 'CREATE DATABASE iranifarsh_db OWNER iranifarsh'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'iranifarsh_db')\gexec

-- 3. Restrict database connection privileges (per server guide)
REVOKE CONNECT ON DATABASE iranifarsh_db FROM PUBLIC;
GRANT CONNECT ON DATABASE iranifarsh_db TO iranifarsh;

-- 4. Grant schema permissions
\connect iranifarsh_db
GRANT ALL ON SCHEMA public TO iranifarsh;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO iranifarsh;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO iranifarsh;
