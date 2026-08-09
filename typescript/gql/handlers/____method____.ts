import type { FunctionContext } from '@constructive-functions/types';

/**
 * The gql surface has no database.
 *
 * A GraphQL/HTTP-served function reaches the tenant's API through `ctx.client`,
 * and its declared buckets, secrets and models through the rest of the context —
 * never Postgres directly. Narrowing the context makes that structural rather
 * than advisory: `ctx.db` is not on the type, so a query is unwritable. A
 * feature that reads the tenant's database directly is scaffolded with
 * `--surface sql` instead.
 */
export type GqlContext = Omit<FunctionContext, 'db'>;

/** A handler on the gql surface: the platform's context, minus the database. */
export type GqlHandler<P, R> = (params: P, context: GqlContext) => Promise<R>;

/**
 * The inputs `handler.json` declares, as types.
 *
 * `subject` is a required string there, so it is a `string` here: the runtime
 * compiles the declaration to JSON Schema and answers a payload that violates
 * it with a 400 before this function is entered. That is why there is no check
 * for it below — a presence check here would be re-asking a question the
 * platform has already refused the request over, and an optional port is
 * `optional: true` in the manifest rather than an `if` in the body.
 */
export interface Params {
  subject: string;
}

export interface Result {
  ok: boolean;
}

/**
 * Throwing is how this function reports failure — the platform records it and
 * retries. Returning an `{ ok: false }` of your own invention hides the failure
 * from both.
 */
export const ____method____: GqlHandler<Params, Result> = async (params, ctx) => {
  ctx.log.info('____name____:____method____', { subject: params.subject });
  return { ok: true };
};
