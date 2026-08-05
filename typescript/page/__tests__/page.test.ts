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
  startPageImage
} from '@constructive-functions/test-utils';
import type { Pool } from 'pg';

import { pages } from '../handlers';

// The database the functions run for. A deployed platform hosts many; a feature
// is one, so the id is a constant rather than something to provision.
const DATABASE_ID = '00000000-0000-0000-0000-0000000000aa';

const FEATURE_DIR = path.resolve(__dirname, '..');

let conn: FunctionsTestResult;
let pool: Pool;
let web: RunningImage;
let gateway: RunningGateway;
let feature: RegisteredFeature;

beforeAll(async () => {
  conn = await getConnections({ featureDir: FEATURE_DIR });
  pool = conn.getPool();
  // Registered from handler.json — the same file the platform reads — so the
  // capabilities this feature declared are the capabilities it is granted here.
  // Use one it never declared and it fails in this suite, not after deploy.
  feature = await registerFeature(pool, DATABASE_ID, FEATURE_DIR);
  web = await startPageImage({ name: feature.image, app: pages });
  gateway = await startGateway({
    pool,
    databaseId: DATABASE_ID,
    images: [web],
    routes: feature.routes
  });
}, 180_000);

afterAll(async () => {
  await gateway.close();
  await web.close();
  await conn.teardown();
});

describe('the page lane', () => {
  it('serves a browser GET through the gateway, unwrapped', async () => {
    const response = await fetch(`${gateway.url}${feature.route}`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(await response.text()).toContain('____name____');
  });

  it('does not ledger a page hit — pages are metered in aggregate', () => {
    expect(gateway.invocations.entries()).toHaveLength(0);
  });
});
