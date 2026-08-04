-- Verify: schemas/____schema____/grants
-- made with <3 @ constructive.io

BEGIN;

SELECT pg_catalog.has_schema_privilege('anonymous', '____schema____', 'usage');

ROLLBACK;
