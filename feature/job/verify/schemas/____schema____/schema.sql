-- Verify: schemas/____schema____/schema

BEGIN;

SELECT pg_catalog.has_schema_privilege('____schema____', 'usage');

ROLLBACK;
