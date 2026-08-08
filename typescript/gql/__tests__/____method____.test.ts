import { createFunctionContext } from '@constructive-functions/test-utils';

import { ____method____ } from '../handlers/____method____';

/**
 * The behaviour test: the function called directly, against the emulated
 * context. No database and no platform, so it runs in milliseconds — this is
 * where the logic belongs. `queue.test.ts` is the one that proves the manifest.
 */
describe('____name____:____method____', () => {
  it('answers a payload', async () => {
    const ctx = createFunctionContext();

    await expect(____method____({}, ctx)).resolves.toEqual({ ok: true });
  });

  it('reports what it did on the context logger', async () => {
    const ctx = createFunctionContext();

    await ____method____({ id: '1' }, ctx);

    expect(ctx.logs).toEqual([
      { level: 'info', args: ['____name____:____method____', { keys: ['id'] }] }
    ]);
  });
});
