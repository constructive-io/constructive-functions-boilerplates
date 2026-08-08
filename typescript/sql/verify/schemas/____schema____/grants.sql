-- Verify: schemas/____schema____/grants
-- made with <3 @ constructive.io

BEGIN;

SELECT pg_catalog.has_function_privilege('authenticated', '____schema____.____method____(text)', 'execute');

ROLLBACK;
