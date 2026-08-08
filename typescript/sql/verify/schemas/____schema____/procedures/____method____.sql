-- Verify: schemas/____schema____/procedures/____method____
-- made with <3 @ constructive.io

BEGIN;

SELECT pg_catalog.has_function_privilege('____schema____.____method____(text)', 'execute');

ROLLBACK;
