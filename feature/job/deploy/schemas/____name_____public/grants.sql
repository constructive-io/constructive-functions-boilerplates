-- Deploy: schemas/____name_____public/grants
-- requires: schemas/____name_____public/schema
-- made with <3 @ constructive.io

BEGIN;

GRANT USAGE ON SCHEMA ____name_____public TO authenticated;

COMMIT;
