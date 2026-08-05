import path from 'node:path';

import type {
  FunctionsTestResult,
  RegisteredFeature,
  RunningGateway,
  RunningImage
} from '@constructive-functions/test-utils';
import {
  getConnections,
  registerFeature,
  startFeatureImage,
  startGateway
} from '@constructive-functions/test-utils';
import type { Pool } from 'pg';

import { methods } from '../handlers';

// The database the functions run for. A deployed platform hosts many; a feature
// is one, so the id is a constant rather than something to provision.
const DATABASE_ID = '00000000-0000-0000-0000-0000000000aa';

const FEATURE_DIR = path.resolve(__dirname, '..');

let conn: FunctionsTestResult;
// The gateway checks out its own connections, so it runs on the harness-owned
// pool rather than the suite's transaction-bound client.
let pool: Pool;
let image: RunningImage;
let gateway: RunningGateway;
let feature: RegisteredFeature;

beforeAll(async () => {
  conn = await getConnections({ featureDir: FEATURE_DIR });
  pool = conn.getPool();
  // Registered from handler.json — the same file the platform reads — so the
  // capabilities this feature declared are the capabilities it is granted here.
  // Use one it never declared and it fails in this suite, not after deploy.
  feature = await registerFeature(pool, DATABASE_ID, FEATURE_DIR);
  image = await startFeatureImage({ name: feature.image, methods });
  gateway = await startGateway({
    pool,
    databaseId: DATABASE_ID,
    images: [image],
    routes: feature.routes
  });
}, 180_000);

afterAll(async () => {
  await gateway.close();
  await image.close();
  await conn.teardown();
});

describe('the sync lane', () => {
  it("answers on the caller's own connection", async () => {
    const response = await fetch(`${gateway.url}${feature.route}`, {
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
      expect.objectContaining({ task_identifier: feature.task, status: 'completed' })
    ]);
  });
});
