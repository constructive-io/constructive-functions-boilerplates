import path from 'node:path';

import type { FunctionsTestResult, RunningImage } from '@constructive-functions/test-utils';
import {
  addJob,
  getConnections,
  registerFeature,
  resolveDatabaseId,
  runQueuedJobs,
  startFeatureImage
} from '@constructive-functions/test-utils';

import { IMAGE, methods, TASK } from '../handlers';

/**
 * The platform test: this feature registered from the very file the platform
 * reads (`handlers/handler.json`), served by the real function server, invoked
 * through the real queue.
 *
 * It is what makes `handler.json` authoritative rather than decorative — a
 * capability the manifest forgot to declare fails here, before deploy, and a
 * task identifier that disagrees with `<category>:<name>` fails at registration.
 */
const featureDir = path.resolve(__dirname, '..');

let conn: FunctionsTestResult;
// The worker claims jobs and pins a connection per dispatch, so it runs on the
// harness-owned pool rather than the suite's transaction-bound client.
// Typed off the harness rather than from `pg`: this feature holds no database
// connection, so it depends on no postgres client.
let pool: ReturnType<FunctionsTestResult['getPool']>;
let image: RunningImage;
let databaseId: string;

beforeAll(async () => {
  conn = await getConnections();
  pool = conn.getPool();
  databaseId = await resolveDatabaseId(pool);

  // `featureDir` compiles the inputs declared in this feature's own
  // `handler.json`, so the payload a deployed image would refuse is refused
  // here too — which is what makes the declaration the only check there is.
  image = await startFeatureImage({ name: IMAGE, methods, featureDir });
  await registerFeature(pool, databaseId, featureDir, { image: IMAGE });
}, 120_000);

// A job that failed is left queued for its retry — that is the queue working.
// Each test starts from an empty one so a deliberate failure here is not the job
// the next test's run picks up.
afterEach(async () => {
  await pool.query('DELETE FROM app_jobs.jobs WHERE database_id = $1', [databaseId]);
});

afterAll(async () => {
  await image.close();
  await conn.teardown();
});

describe('____name____:____method____ through the platform', () => {
  it('runs the job the platform enqueues', async () => {
    await addJob(pool, databaseId, TASK, { subject: 'a subject' }, { entity_type: 'platform' });

    const { jobs, log } = await runQueuedJobs({ pool, databaseId, images: [image] });

    expect(jobs).toHaveLength(1);
    expect(log.entries).toEqual([
      expect.objectContaining({ task_identifier: TASK, status: 'completed' })
    ]);
  });

  // The declaration is the check: the handler asks nothing about its payload,
  // because a payload the manifest does not allow never reaches it.
  it('refuses a payload the manifest does not allow', async () => {
    await addJob(pool, databaseId, TASK, {}, { entity_type: 'platform' });

    await expect(runQueuedJobs({ pool, databaseId, images: [image] })).rejects.toThrow(
      /subject is required/
    );
  });
});
