import path from 'node:path';

import {
  defineFunction,
  enqueue,
  runQueuedJobs,
  startProcessImage
} from '@constructive-functions/feature-runtime';
import type { RunningImage } from '@constructive-functions/feature-runtime';
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
let image: RunningImage;

beforeAll(async () => {
  conn = await getFeatureConnections(path.resolve(__dirname, '..'));
  pool = createWorkerPool(conn);
  image = await startProcessImage({
    name: IMAGE,
    command: 'python3',
    args: ['server.py'],
    cwd: path.resolve(__dirname, '..', 'handlers')
  });
  await defineFunction(pool, DATABASE_ID, { task: TASK, image: IMAGE });
}, 120_000);

afterAll(async () => {
  await image.close();
  await pool.end();
  await conn.teardown();
});

describe('the queue lane', () => {
  it('dispatches a queued job to the python image over HTTP', async () => {
    await enqueue(pool, DATABASE_ID, TASK, {});

    const { jobs, log } = await runQueuedJobs({ pool, databaseId: DATABASE_ID, images: [image] });

    expect(jobs).toHaveLength(1);
    expect(log.entries).toEqual([
      expect.objectContaining({ task_identifier: TASK, status: 'completed' })
    ]);
  });
});
