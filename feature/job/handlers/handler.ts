import type { HandlerContext } from '@constructive-functions/feature-runtime';

export const TASK = '____task____';

export interface Result {
  ok: boolean;
}

/**
 * The feature's function. A payload arrives off the queue as untyped JSON, so
 * validate it at the boundary and fail loud on anything else — a malformed
 * payload is a caller bug, not an `undefined` three frames down.
 *
 * `ctx.pool` is the connection the worker pinned for this job, with the job's
 * claims already stamped on it: a handler's reads and writes belong to the
 * job's transaction, so it must not open its own.
 */
export async function handler(
  payload: Record<string, unknown>,
  ctx: HandlerContext
): Promise<Result> {
  void payload;
  void ctx;
  return { ok: true };
}
