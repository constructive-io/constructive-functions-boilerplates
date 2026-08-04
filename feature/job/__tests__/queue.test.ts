import path from 'node:path';

import { defineFunction, enqueue, runQueuedJobs } from '@constructive-functions/feature-runtime';
import { createWorkerPool, getFeatureConnections } from '@constructive-functions/harness';
import type { Pool } from 'pg';
import type { GetConnectionResult } from 'pgsql-test';

import { handler, TASK } from '../handlers/handler';

// The database the functions run for. A deployed platform hosts many; this repo
// is one, so the id is a constant rather than something to provision.
const DATABASE_ID = '00000000-0000-0000-0000-0000000000aa';

let conn: GetConnectionResult;
let pool: Pool;

beforeAll(async () => {
  conn = await getFeatureConnections(path.resolve(__dirname, '..'));
  pool = createWorkerPool(conn);
  await defineFunction(pool, DATABASE_ID, { task: TASK, handler });
}, 120_000);

afterAll(async () => {
  await pool.end();
  await conn.teardown();
});

describe('running the feature through the job queue', () => {
  it('dispatches a queued job to the handler and returns its result', async () => {
    await enqueue(pool, DATABASE_ID, TASK, {});

    const { jobs } = await runQueuedJobs({
      pool,
      databaseId: DATABASE_ID,
      functions: [{ task: TASK, handler }]
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].task_identifier).toBe(TASK);
  });
});
