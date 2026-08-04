import path from 'node:path';

import {
  defineFunction,
  startGateway,
  startProcessImage
} from '@constructive-functions/feature-runtime';
import type { RunningGateway, RunningImage } from '@constructive-functions/feature-runtime';
import { createWorkerPool, getFeatureConnections } from '@constructive-functions/harness';
import type { Pool } from 'pg';
import type { GetConnectionResult } from 'pgsql-test';

// The database the functions run for. A deployed platform hosts many; this repo
// is one, so the id is a constant rather than something to provision.
const DATABASE_ID = '00000000-0000-0000-0000-0000000000aa';

// The image is a process, so its language stops mattering at this boundary: the
// platform POSTs to a URL either way.
const IMAGE = '____name____';
const TASK = '____name____:____method____';

let conn: GetConnectionResult;
let pool: Pool;
let web: RunningImage;
let gateway: RunningGateway;

beforeAll(async () => {
  conn = await getFeatureConnections(path.resolve(__dirname, '..'));
  pool = createWorkerPool(conn);
  web = await startProcessImage({
    name: IMAGE,
    command: 'python3',
    args: ['server.py'],
    cwd: path.resolve(__dirname, '..', 'handlers')
  });
  await defineFunction(pool, DATABASE_ID, { task: TASK, image: IMAGE, channels: ['page'] });
  gateway = await startGateway({
    pool,
    databaseId: DATABASE_ID,
    images: [web],
    routes: { '____route____': TASK }
  });
}, 120_000);

afterAll(async () => {
  await gateway.close();
  await web.close();
  await pool.end();
  await conn.teardown();
});

describe('the page lane', () => {
  it('serves a browser GET through the gateway', async () => {
    const response = await fetch(`${gateway.url}____route____`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(await response.text()).toContain('____name____');
  });
});
