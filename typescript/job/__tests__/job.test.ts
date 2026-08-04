import path from 'node:path';

import type {
  FunctionsTestResult,
  RunningImage
} from '@constructive-functions/test-utils';
import {
  addJob,
  getConnections,
  registerFunction,
  runQueuedJobs,
  startFeatureImage
} from '@constructive-functions/test-utils';
import type { Pool } from 'pg';

import { IMAGE, methods, TASK } from '../handlers';

// The database the functions run for. A deployed platform hosts many; a feature
// is one, so the id is a constant rather than something to provision.
const DATABASE_ID = '00000000-0000-0000-0000-0000000000aa';

let conn: FunctionsTestResult;
// The worker claims jobs and pins a connection per dispatch, so it runs on the
// harness-owned pool rather than the suite's transaction-bound client.
let pool: Pool;
let image: RunningImage;

beforeAll(async () => {
  conn = await getConnections({ featureDir: path.resolve(__dirname, '..') });
  pool = conn.getPool();
  image = await startFeatureImage({ name: IMAGE, methods });
  await registerFunction(pool, DATABASE_ID, TASK, '', { runtime: 'http', image: IMAGE });
}, 180_000);

afterAll(async () => {
  await image.close();
  await conn.teardown();
});

describe('the queue lane', () => {
  it('dispatches a queued job to the image over HTTP', async () => {
    await addJob(pool, DATABASE_ID, TASK, {}, { entity_type: 'platform' });

    const { jobs, log } = await runQueuedJobs({ pool, databaseId: DATABASE_ID, images: [image] });

    expect(jobs).toHaveLength(1);
    expect(log.entries).toEqual([
      expect.objectContaining({ task_identifier: TASK, status: 'completed' })
    ]);
  });
});
