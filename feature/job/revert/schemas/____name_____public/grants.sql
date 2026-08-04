-- Revert: schemas/____name_____public/grants

BEGIN;

REVOKE USAGE ON SCHEMA ____name_____public FROM authenticated;

COMMIT;
