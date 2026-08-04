import type { FunctionHandler } from '@constructive-functions/types';

export const TASK = '____name____:____method____';

export interface Result {
  ok: boolean;
}

/**
 * The sync lane: a JSON request the caller waits on. The return value IS the
 * response — the gateway wraps it as `{ ok, result, invocationId }` — so keep it
 * small and serializable, and throw to return a failure rather than encoding one.
 */
export const ____method____: FunctionHandler<Record<string, unknown>, Result> = async (params) => {
  void params;
  return { ok: true };
};
