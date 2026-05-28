-- Create the Keycloak database once on fresh Postgres volume init.
-- Files in /docker-entrypoint-initdb.d run only when PGDATA is empty.

SELECT 'CREATE DATABASE keycloak'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'keycloak')\gexec

