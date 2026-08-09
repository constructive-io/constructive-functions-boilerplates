import path from 'node:path';

import type { FunctionsTestResult } from '@constructive-functions/test-utils';
import {
  createFunctionContext,
  getConnections,
  resolveDatabaseId
} from '@constructive-functions/test-utils';

import { ____method____ } from '../handlers/____method____';

/**
 * The behaviour test: the function called directly, on the context the runtime
 * would have built. `ctx.db` is the one surface never emulated — emulating a
 * transaction would emulate away the RLS it exists to enforce — so this suite
 * owns a database and the context finds its pool.
 *
 * The identity is the fixture: a job carrying an actor runs as `authenticated`
 * and one without runs as `anonymous`, and which grants apply follows from that.
 * `queue.test.ts` is the one that proves the manifest.
 */
const ACTOR = '00000000-0000-0000-0000-0000000000a1';

let conn: FunctionsTestResult;
let databaseId: string;

beforeAll(async () => {
  conn = await getConnections({ featureDir: path.resolve(__dirname, '..') });
  databaseId = await resolveDatabaseId(conn.getPool());
}, 120_000);

afterAll(async () => {
  await conn.teardown();
});

describe('____name____:____method____', () => {
  it('reads for the tenant it was invoked for, as the actor', async () => {
    const ctx = createFunctionContext({ job: { databaseId, actorId: ACTOR } });

    await expect(____method____({ subject: 'a subject' }, ctx)).resolves.toEqual({
      answer: `a subject read for ${databaseId}`,
      role: 'authenticated'
    });
  });

  it('runs as anonymous when no actor invoked it', async () => {
    const ctx = createFunctionContext({ job: { databaseId } });

    const { role } = await ____method____({ subject: 'a subject' }, ctx);

    expect(role).toBe('anonymous');
  });
});
