import { createFunctionContext } from '@constructive-functions/test-utils';

import { ____method____ } from '../handlers/____method____';

/**
 * The behaviour test: the function called directly, against the emulated
 * context. No database and no platform, so it runs in milliseconds — this is
 * where the logic belongs. `queue.test.ts` is the one that proves the manifest.
 */
describe('____name____:____method____', () => {
  // Every invocation runs *for* a tenant, so the emulated context is built with
  // the identity the runtime would have refused the request without.
  const job = { databaseId: '00000000-0000-4000-8000-0000000000ff' };

  it('answers a payload', async () => {
    const ctx = createFunctionContext({ job });

    await expect(____method____({ subject: 'a subject' }, ctx)).resolves.toEqual({ ok: true });
  });

  it('reports what it did on the context logger', async () => {
    const ctx = createFunctionContext({ job });

    await ____method____({ subject: 'a subject' }, ctx);

    expect(ctx.logs).toEqual([
      { level: 'info', args: ['____name____:____method____', { subject: 'a subject' }] }
    ]);
  });
});
