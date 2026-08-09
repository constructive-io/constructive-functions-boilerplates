import type { FunctionHandler } from '@constructive-functions/types';

/**
 * The inputs `handler.json` declares, as types.
 *
 * `subject` is a required string there, so it is a `string` here: the runtime
 * compiles the declaration to JSON Schema and refuses a payload that violates
 * it with a 400 before this function is entered — which is why nothing below
 * checks for it. An optional port is `optional: true` in the manifest, not an
 * `if` in the body.
 */
export interface Params {
  subject: string;
}

export interface Result {
  answer: string;
  /** The role the invocation's transaction assumed — the tenant's, not the pod's. */
  role: string;
}

/**
 * The sql surface: this function holds a database connection.
 *
 * `ctx.db(fn)` runs the callback in one transaction that has assumed a
 * low-privilege role and stamped this invocation's identity claims, so the
 * tenant's RLS applies to every statement — it commits on return and rolls back
 * on throw. There is deliberately no pool on the context: a raw pool is the
 * worker's own privileged, RLS-exempt connection, and a handler that opened one
 * would be reading every tenant's rows.
 *
 * The query below reads what that transaction *is*, because it is the one thing
 * true of every database this feature might run against: the role follows the
 * invocation's actor (`authenticated` with one, `anonymous` without), and the
 * claims name the tenant. Replace it with your own statements against the rows a
 * seed put there — the tables belong to the platform and the seeds, never to a
 * feature.
 */
export const ____method____: FunctionHandler<Params, Result> = async (params, ctx) => {
  return ctx.db(async (db) => {
    const { rows } = await db.query(
      "SELECT current_user AS role, current_setting('jwt.claims.database_id', true) AS database_id"
    );
    const { role, database_id: databaseId } = rows[0] ?? {};
    if (typeof role !== 'string' || typeof databaseId !== 'string') {
      // The transaction always assumes a role and always stamps the claim, so
      // reading neither means this ran somewhere it should not have.
      throw new Error(
        `____name____:____method____: read role=${String(role)} database=${String(databaseId)}`
      );
    }
    return { answer: `${params.subject} read for ${databaseId}`, role };
  });
};
