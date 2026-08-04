-- Deploy: schemas/____schema____/grants
-- requires: schemas/____schema____/schema
-- made with <3 @ constructive.io

BEGIN;

GRANT USAGE ON SCHEMA ____schema____ TO authenticated;

COMMIT;
