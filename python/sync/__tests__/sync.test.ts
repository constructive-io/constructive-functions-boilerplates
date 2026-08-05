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
  startGateway,
  startProcessImage
} from '@constructive-functions/test-utils';
import type { Pool } from 'pg';

// The database the functions run for. A deployed platform hosts many; a feature
// is one, so the id is a constant rather than something to provision.
const DATABASE_ID = '00000000-0000-0000-0000-0000000000aa';

const FEATURE_DIR = path.resolve(__dirname, '..');

// The image is a process, so its language stops mattering at this boundary: the
// platform POSTs to a URL either way.
const HANDLERS_DIR = path.resolve(FEATURE_DIR, 'handlers');

let conn: FunctionsTestResult;
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
  image = await startProcessImage({
    name: feature.image,
    command: 'python3',
    args: ['server.py'],
    cwd: HANDLERS_DIR
  });
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
    expect(await response.json()).toMatchObject({ ok: true, result: { ok: true } });
  });
});
