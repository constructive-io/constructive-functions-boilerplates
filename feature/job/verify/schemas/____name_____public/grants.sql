-- Verify: schemas/____name_____public/grants

BEGIN;

SELECT pg_catalog.has_schema_privilege('authenticated', '____name_____public', 'usage');

ROLLBACK;
