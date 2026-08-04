import path from 'node:path';

import {
  defineFunction,
  enqueue,
  runQueuedJobs,
  startFeatureImage
} from '@constructive-functions/feature-runtime';
import type { RunningImage } from '@constructive-functions/feature-runtime';
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

beforeAll(async () => {
  conn = await getFeatureConnections(path.resolve(__dirname, '..'));
  pool = createWorkerPool(conn);
  image = await startFeatureImage({ name: IMAGE, methods });
  await defineFunction(pool, DATABASE_ID, { task: TASK, image: IMAGE });
}, 120_000);

afterAll(async () => {
  await image.close();
  await pool.end();
  await conn.teardown();
});

describe('the queue lane', () => {
  it('dispatches a queued job to the image over HTTP', async () => {
    await enqueue(pool, DATABASE_ID, TASK, {});

    const { jobs, log } = await runQueuedJobs({ pool, databaseId: DATABASE_ID, images: [image] });

    expect(jobs).toHaveLength(1);
    expect(log.entries).toEqual([
      expect.objectContaining({ task_identifier: TASK, status: 'completed' })
    ]);
  });
});
