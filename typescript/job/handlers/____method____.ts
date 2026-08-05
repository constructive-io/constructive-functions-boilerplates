import type { FunctionHandler } from '@constructive-functions/types';

export interface Result {
  ok: boolean;
}

/**
 * The queue lane: work nobody waits for. A payload arrives as untyped JSON, so
 * validate it at the boundary and fail loud on anything else — a malformed
 * payload is a caller bug, not an `undefined` three frames down. Throwing fails
 * the job, which is what makes it retryable.
 */
export const ____method____: FunctionHandler<Record<string, unknown>, Result> = async (
  params,
  context
) => {
  context.log.info('____name____:____method____ received', { params });
  return { ok: true };
};
