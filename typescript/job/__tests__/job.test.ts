import path from 'node:path';

import type {
  FunctionsTestResult,
  RegisteredFeature,
  RunningImage
} from '@constructive-functions/test-utils';
import {
  addJob,
  getConnections,
  registerFeature,
  runQueuedJobs,
  startFeatureImage
} from '@constructive-functions/test-utils';
import type { Pool } from 'pg';

import { methods } from '../handlers';

// The database the functions run for. A deployed platform hosts many; a feature
// is one, so the id is a constant rather than something to provision.
const DATABASE_ID = '00000000-0000-0000-0000-0000000000aa';

const FEATURE_DIR = path.resolve(__dirname, '..');

let conn: FunctionsTestResult;
// The worker claims jobs and pins a connection per dispatch, so it runs on the
// harness-owned pool rather than the suite's transaction-bound client.
let pool: Pool;
let image: RunningImage;
let feature: RegisteredFeature;

beforeAll(async () => {
  conn = await getConnections({ featureDir: FEATURE_DIR });
  pool = conn.getPool();
  // Registered from handler.json — the same file the platform reads — so the
  // capabilities this feature declared are the capabilities it is granted here.
  // Use one it never declared and it fails in this suite, not after deploy.
  feature = await registerFeature(pool, DATABASE_ID, FEATURE_DIR);
  image = await startFeatureImage({ name: feature.image, methods });
}, 180_000);

afterAll(async () => {
  await image.close();
  await conn.teardown();
});

describe('the queue lane', () => {
  it('dispatches a queued job to the image over HTTP', async () => {
    await addJob(pool, DATABASE_ID, feature.task, {}, { entity_type: 'platform' });

    const { jobs, log } = await runQueuedJobs({ pool, databaseId: DATABASE_ID, images: [image] });

    expect(jobs).toHaveLength(1);
    expect(log.entries).toEqual([
      expect.objectContaining({ task_identifier: feature.task, status: 'completed' })
    ]);
  });
});
