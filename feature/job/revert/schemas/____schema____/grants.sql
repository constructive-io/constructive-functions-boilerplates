-- Revert: schemas/____schema____/grants

BEGIN;

REVOKE USAGE ON SCHEMA ____schema____ FROM authenticated;

COMMIT;
