import type { FunctionContext, FunctionHandler } from '@constructive-functions/types';

export interface Params {
  [key: string]: unknown;
}

export interface Result {
  ok: boolean;
}

/**
 * ____name____:____method____ — one function of this image.
 *
 * Every named export is a method the generated server serves at
 * `POST /<export>`, which is how the platform addresses
 * `____name____:<export>`. A second function is a second export here and a
 * second entry in `methods[]` in `handler.json`; nothing else changes.
 *
 * `context` carries what this handler is allowed to reach — `client`/`meta`
 * (tenant GraphQL), `storage`, `secrets`, `agent`, `db`, `log`, `job` — and
 * refuses anything `handler.json` does not declare, so declare capabilities as
 * you write the code that uses them.
 *
 * A payload arrives as untyped JSON, so validate it at the boundary and throw on
 * anything else: a malformed payload is the caller's bug, and throwing is how
 * this function reports failure — the platform records it and retries.
 */
export const ____method____: FunctionHandler<Params, Result> = async (
  params: Params,
  ctx: FunctionContext
) => {
  ctx.log.info('____name____:____method____', { keys: Object.keys(params) });
  return { ok: true };
};
