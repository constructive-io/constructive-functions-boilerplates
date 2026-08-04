import path from 'node:path';

import { defineFunction, startFeatureImage, startGateway } from '@constructive-functions/feature-runtime';
import type { RunningGateway, RunningImage } from '@constructive-functions/feature-runtime';
import { createWorkerPool, getFeatureConnections } from '@constructive-functions/harness';
import type { Pool } from 'pg';
import type { GetConnectionResult } from 'pgsql-test';

import { IMAGE, methods, TASK } from '../handlers';

// The database the functions run for. A deployed platform hosts many; this repo
// is one, so the id is a constant rather than something to provision.
const DATABASE_ID = '00000000-0000-0000-0000-0000000000aa';

let conn: GetConnectionResult;
let pool: Pool;
let image: RunningImage;
let gateway: RunningGateway;

beforeAll(async () => {
  conn = await getFeatureConnections(path.resolve(__dirname, '..'));
  pool = createWorkerPool(conn);
  image = await startFeatureImage({ name: IMAGE, methods });
  await defineFunction(pool, DATABASE_ID, { task: TASK, image: IMAGE, channels: ['sync'] });
  gateway = await startGateway({
    pool,
    databaseId: DATABASE_ID,
    images: [image],
    routes: { '____route____': TASK }
  });
}, 120_000);

afterAll(async () => {
  await gateway.close();
  await image.close();
  await pool.end();
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
});
