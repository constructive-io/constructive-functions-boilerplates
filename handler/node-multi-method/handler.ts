import type { FunctionContext, FunctionHandler } from '@constructive-functions/types';

/**
 * The inputs `handler.json` declares, as types: `subject` is a required string
 * there, so it is a `string` here. The runtime compiles the declaration and
 * refuses a payload that violates it with a 400 before this function is
 * entered, which is why nothing below checks it — an optional port is
 * `optional: true` in the manifest, not an `if` in the body.
 */
export interface Params {
  subject: string;
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
 * Throwing is how this function reports failure — the platform records it and
 * retries. An `{ ok: false }` of your own invention hides it from both.
 */
export const ____method____: FunctionHandler<Params, Result> = async (
  params: Params,
  ctx: FunctionContext
) => {
  ctx.log.info('____name____:____method____', { subject: params.subject });
  return { ok: true };
};
