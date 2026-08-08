import type { FunctionHandler } from '@constructive-functions/types';

import { ____method____ } from './____method____';

/** The image serving this feature's functions. */
export const IMAGE = 'fn-____name____';

/** What a caller enqueues or the gateway routes to. */
export const TASK = '____name____:____method____';

/**
 * What the container serves: `POST /<method>`, which is how the platform
 * addresses `____name____:<method>`. A second function is a second entry here
 * and a second `methods[]` entry in `handler.json` — nothing else.
 *
 * The identity — the task, the image, the channel it answers on, and everything
 * this feature is allowed to reach — lives in `handler.json`, because the
 * platform reads that file too. This one is behaviour only.
 */
export const methods: Record<string, FunctionHandler<Record<string, unknown>>> = {
  ____method____
};
