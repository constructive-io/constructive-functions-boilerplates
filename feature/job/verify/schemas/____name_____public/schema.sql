-- Verify: schemas/____name_____public/schema

BEGIN;

SELECT pg_catalog.has_schema_privilege('____name_____public', 'usage');

ROLLBACK;
