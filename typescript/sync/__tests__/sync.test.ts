import path from 'node:path';

import type {
  FunctionsTestResult,
  RunningGateway,
  RunningImage
} from '@constructive-functions/test-utils';
import {
  getConnections,
  registerFunction,
  startFeatureImage,
  startGateway
} from '@constructive-functions/test-utils';
import type { Pool } from 'pg';

import { IMAGE, methods, TASK } from '../handlers';

// The database the functions run for. A deployed platform hosts many; a feature
// is one, so the id is a constant rather than something to provision.
const DATABASE_ID = '00000000-0000-0000-0000-0000000000aa';

let conn: FunctionsTestResult;
// The gateway checks out its own connections, so it runs on the harness-owned
// pool rather than the suite's transaction-bound client.
let pool: Pool;
let image: RunningImage;
let gateway: RunningGateway;

beforeAll(async () => {
  conn = await getConnections({ featureDir: path.resolve(__dirname, '..') });
  pool = conn.getPool();
  image = await startFeatureImage({ name: IMAGE, methods });
  await registerFunction(pool, DATABASE_ID, TASK, '', {
    runtime: 'http',
    image: IMAGE,
    accessChannels: ['sync']
  });
  gateway = await startGateway({
    pool,
    databaseId: DATABASE_ID,
    images: [image],
    routes: { '____route____': TASK }
  });
}, 180_000);

afterAll(async () => {
  await gateway.close();
  await image.close();
  await conn.teardown();
});

describe('the sync lane', () => {
  it("answers on the caller's own connection", async () => {
    const response = await fetch(`${gateway.url}____route____`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });

    expect(response.status).toBe(200);
    // The envelope: the result plus the ledger row it was recorded under, which
    // is what makes the call auditable after the fact.
    expect(await response.json()).toMatchObject({ ok: true, result: { ok: true } });
  });

  it('ledgers the invocation', () => {
    expect(gateway.invocations.entries()).toEqual([
      expect.objectContaining({ task_identifier: TASK, status: 'completed' })
    ]);
  });
});
