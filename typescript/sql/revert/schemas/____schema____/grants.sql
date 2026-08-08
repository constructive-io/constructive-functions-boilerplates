-- Revert: schemas/____schema____/grants
-- made with <3 @ constructive.io

BEGIN;

REVOKE EXECUTE ON FUNCTION ____schema____.____method____(text) FROM authenticated;

REVOKE USAGE ON SCHEMA ____schema____ FROM authenticated;

COMMIT;
