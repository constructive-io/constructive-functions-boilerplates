-- Verify: schemas/____schema____/schema
-- made with <3 @ constructive.io

BEGIN;

SELECT pg_catalog.has_schema_privilege('____schema____', 'usage');

ROLLBACK;
