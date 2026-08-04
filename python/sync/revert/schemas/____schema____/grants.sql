-- Revert: schemas/____schema____/grants
-- made with <3 @ constructive.io

BEGIN;

REVOKE USAGE ON SCHEMA ____schema____ FROM anonymous, authenticated;

COMMIT;
