-- Deploy: schemas/____schema____/grants
-- requires: schemas/____schema____/procedures/____method____
-- made with <3 @ constructive.io

BEGIN;

-- The role `ctx.db` assumes for an invocation, and nothing wider: usage for
-- `anonymous` would publish this feature's schema to unauthenticated callers,
-- which is an exposure decision to make deliberately rather than a default.
GRANT USAGE ON SCHEMA ____schema____ TO authenticated;

GRANT EXECUTE ON FUNCTION ____schema____.____method____(text) TO authenticated;

COMMIT;
