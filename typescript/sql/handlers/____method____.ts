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
 * The SQL itself belongs to this feature's pgpm module (`deploy/`), so the query
 * here is a call into it rather than statements assembled in TypeScript.
 */
export const ____method____: FunctionHandler<Params, Result> = async (params, ctx) => {
  return ctx.db(async (db) => {
    const { rows } = await db.query('SELECT ____schema____.____method____($1) AS answer', [
      params.subject
    ]);
    const answer = rows[0]?.answer;
    if (typeof answer !== 'string') {
      throw new Error(
        `____name____:____method____: ____schema____.____method____ returned ${typeof answer}`
      );
    }
    return { answer };
  });
};
