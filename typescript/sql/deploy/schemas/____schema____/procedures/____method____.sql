-- Deploy: schemas/____schema____/procedures/____method____
-- requires: schemas/____schema____/schema
-- made with <3 @ constructive.io

BEGIN;

CREATE FUNCTION ____schema____.____method____(subject text)
  RETURNS text
  AS $$
  SELECT '____name____:____method____ answered for ' || COALESCE(NULLIF(btrim(subject), ''), 'nobody');
$$
LANGUAGE sql
IMMUTABLE
STRICT;

COMMIT;
