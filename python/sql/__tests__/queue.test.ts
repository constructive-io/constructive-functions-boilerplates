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
 * through the real queue, reaching the tenant's database through `ctx.db`.
 *
 * A python feature has no `handlers/index.ts` to import — the image discovers
 * its methods from `handler.py`, so nothing here reaches into the handler's
 * code. What runs is `main.py` importing `handler.py` through
 * `constructive_runtime`, with only the container removed; the first time it
 * runs, the harness builds the image's venv, which is why the timeout is
 * generous.
 *
 * The jobs carry an actor because `ctx.db` runs an invocation with one as
 * `authenticated` and one without as `anonymous` — the role decides which
 * grants apply, so it is part of the fixture, not a detail.
 */
const featureDir = path.resolve(__dirname, '..');

const IMAGE = 'features/____name____';
const TASK = '____name____:____method____';

const ACTOR = '00000000-0000-0000-0000-0000000000a1';

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

  // The image is given this suite's connection: a deployed container reads its
  // own from the environment, which here would name the template rather than
  // the database this test owns.
  image = await startPythonImage({ name: IMAGE, featureDir, pool });
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
  it('runs the job the platform enqueues, against the tenant it names', async () => {
    await addJob(
      pool,
      databaseId,
      TASK,
      { subject: 'a subject' },
      { entity_type: 'platform', identity: { actorId: ACTOR } }
    );

    const { jobs, log } = await runQueuedJobs({ pool, databaseId, images: [image] });

    expect(jobs).toHaveLength(1);
    expect(log.entries).toEqual([
      expect.objectContaining({ task_identifier: TASK, status: 'completed' })
    ]);
  });

  // The declaration is the check: nothing in the handler asks whether `subject`
  // is there, because a payload without it never reaches the handler.
  it('refuses a payload the manifest does not allow', async () => {
    await addJob(
      pool,
      databaseId,
      TASK,
      {},
      { entity_type: 'platform', identity: { actorId: ACTOR } }
    );

    await expect(runQueuedJobs({ pool, databaseId, images: [image] })).rejects.toThrow(
      /subject is required/
    );
  });
});
