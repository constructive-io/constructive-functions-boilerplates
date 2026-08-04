import path from 'node:path';

import type {
  FunctionsTestResult,
  RunningGateway,
  RunningImage
} from '@constructive-functions/test-utils';
import {
  getConnections,
  registerFunction,
  startGateway,
  startPageImage
} from '@constructive-functions/test-utils';
import type { Pool } from 'pg';

import { IMAGE, pages, TASK } from '../handlers';

// The database the functions run for. A deployed platform hosts many; a feature
// is one, so the id is a constant rather than something to provision.
const DATABASE_ID = '00000000-0000-0000-0000-0000000000aa';

let conn: FunctionsTestResult;
let pool: Pool;
let web: RunningImage;
let gateway: RunningGateway;

beforeAll(async () => {
  conn = await getConnections({ featureDir: path.resolve(__dirname, '..') });
  pool = conn.getPool();
  web = await startPageImage({ name: IMAGE, app: pages });
  await registerFunction(pool, DATABASE_ID, TASK, '', {
    runtime: 'http',
    image: IMAGE,
    accessChannels: ['page']
  });
  gateway = await startGateway({
    pool,
    databaseId: DATABASE_ID,
    images: [web],
    routes: { '____route____': TASK }
  });
}, 180_000);

afterAll(async () => {
  await gateway.close();
  await web.close();
  await conn.teardown();
});

describe('the page lane', () => {
  it('serves a browser GET through the gateway, unwrapped', async () => {
    const response = await fetch(`${gateway.url}____route____`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(await response.text()).toContain('____name____');
  });

  it('does not ledger a page hit — pages are metered in aggregate', () => {
    expect(gateway.invocations.entries()).toHaveLength(0);
  });
});
