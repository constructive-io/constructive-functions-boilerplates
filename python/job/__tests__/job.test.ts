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
  startProcessImage
} from '@constructive-functions/test-utils';
import type { Pool } from 'pg';

// The database the functions run for. A deployed platform hosts many; a feature
// is one, so the id is a constant rather than something to provision.
const DATABASE_ID = '00000000-0000-0000-0000-0000000000aa';

// The image is a process, so its language stops mattering at this boundary: the
// platform POSTs to a URL either way.
const IMAGE = '____name____';
const TASK = '____name____:____method____';

let conn: FunctionsTestResult;
let pool: Pool;
let image: RunningImage;

beforeAll(async () => {
  conn = await getConnections({ featureDir: path.resolve(__dirname, '..') });
  pool = conn.getPool();
  image = await startProcessImage({
    name: IMAGE,
    command: 'python3',
    args: ['server.py'],
    cwd: path.resolve(__dirname, '..', 'handlers')
  });
  await registerFunction(pool, DATABASE_ID, TASK, '', { runtime: 'http', image: IMAGE });
}, 180_000);

afterAll(async () => {
  await image.close();
  await conn.teardown();
});

describe('the queue lane', () => {
  it('dispatches a queued job to the python image over HTTP', async () => {
    await addJob(pool, DATABASE_ID, TASK, {}, { entity_type: 'platform' });

    const { jobs, log } = await runQueuedJobs({ pool, databaseId: DATABASE_ID, images: [image] });

    expect(jobs).toHaveLength(1);
    expect(log.entries).toEqual([
      expect.objectContaining({ task_identifier: TASK, status: 'completed' })
    ]);
  });
});
