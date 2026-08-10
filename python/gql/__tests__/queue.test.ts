import path from 'node:path';

import type { FunctionsTestResult, RunningImage } from '@constructive-functions/test-utils';
import {
  addJob,
  getConnections,
  registerFeature,
  resolveDatabaseId,
  runQueuedJobs,
  startPythonImage
} from '@constructive-functions/test-utils';

/**
 * The platform test: this feature registered from the very file the platform
 * reads (`handlers/handler.json`), served by the real python image, invoked
 * through the real queue.
 *
 * A python feature has no `handlers/index.ts` to import — the image discovers
 * its methods from `handler.py`, so nothing here reaches into the handler's
 * code. What runs is `main.py` importing `handler.py` through
 * `constructive_runtime`, with only the container removed; the first time it
 * runs, the harness builds the image's venv, which is why the timeout is
 * generous.
 *
 * This is what makes `handler.json` authoritative rather than decorative — a
 * capability the manifest forgot to declare fails here, before deploy, and a
 * task identifier that disagrees with `<category>:<name>` fails at registration.
 */
const featureDir = path.resolve(__dirname, '..');

const IMAGE = 'features/____name____';
const TASK = '____name____:____method____';

let conn: FunctionsTestResult;
// The worker claims jobs and pins a connection per dispatch, so it runs on the
// harness-owned pool rather than the suite's transaction-bound client.
let pool: ReturnType<FunctionsTestResult['getPool']>;
let image: RunningImage;
let databaseId: string;

beforeAll(async () => {
  conn = await getConnections();
  pool = conn.getPool();
  databaseId = await resolveDatabaseId(pool);

  // No pool is handed to the image: this feature has no database connection,
  // and one given here would be one `ctx.db` could use.
  image = await startPythonImage({ name: IMAGE, featureDir });
  await registerFeature(pool, databaseId, featureDir, { image: IMAGE });
}, 600_000);

// A job that failed is left queued for its retry — that is the queue working.
// Each test starts from an empty one so a deliberate failure here is not the job
// the next test's run picks up.
afterEach(async () => {
  await pool.query('DELETE FROM app_jobs.jobs WHERE database_id = $1', [databaseId]);
});

afterAll(async () => {
  await image?.close();
  await conn?.teardown();
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
