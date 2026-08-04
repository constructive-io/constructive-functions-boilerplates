-- Verify: schemas/____schema____/grants

BEGIN;

SELECT pg_catalog.has_schema_privilege('authenticated', '____schema____', 'usage');

ROLLBACK;
