import type { FunctionContext } from '@constructive-functions/types';

/**
 * The gql surface has no database.
 *
 * A GraphQL/HTTP-served function reaches the tenant's API through `ctx.client`,
 * and its declared buckets, secrets and models through the rest of the context —
 * never Postgres directly. Narrowing the context makes that structural rather
 * than advisory: `ctx.db` is not on the type, so a query is unwritable. A
 * feature that genuinely owns SQL is scaffolded with `--surface sql` instead.
 */
export type GqlContext = Omit<FunctionContext, 'db'>;

/** A handler on the gql surface: the platform's context, minus the database. */
export type GqlHandler<P, R> = (params: P, context: GqlContext) => Promise<R>;

export interface Params {
  [key: string]: unknown;
}

export interface Result {
  ok: boolean;
}

/**
 * A payload arrives as untyped JSON, so validate it at the boundary and throw on
 * anything else: a malformed payload is the caller's bug, and throwing is how
 * this function reports failure — the platform records it and retries. Returning
 * an `{ ok: false }` of your own invention hides it from both.
 */
export const ____method____: GqlHandler<Params, Result> = async (params, ctx) => {
  ctx.log.info('____name____:____method____', { keys: Object.keys(params) });
  return { ok: true };
};
