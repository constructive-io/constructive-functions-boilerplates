import path from 'node:path';

import { asRole, getConnections } from '@constructive-functions/test-utils';
import type { PgTestClient } from 'pgsql-test';

/**
 * The SQL this feature owns, tested as SQL: its pgpm module is deployed on top
 * of the platform surface into an isolated database, and each test runs inside a
 * savepoint. `queue.test.ts` is what proves the handler reaches it through
 * `ctx.db`.
 *
 * The tests run as the role an invocation really assumes rather than as the
 * owner, so the grants this module ships are part of what is under test: SQL
 * that passes as its owner and is unreachable at runtime is the failure this
 * catches.
 */
const ACTOR = '00000000-0000-0000-0000-0000000000a1';

let db: PgTestClient;
let teardown: () => Promise<void>;

beforeAll(async () => {
  ({ db, teardown } = await getConnections({ featureDir: path.resolve(__dirname, '..') }));
}, 120_000);

afterAll(async () => {
  await teardown();
});

beforeEach(async () => {
  await db.beforeEach();
});

afterEach(async () => {
  await db.afterEach();
});

describe('____schema____.____method____', () => {
  it('answers about its subject', async () => {
    await asRole(db, 'authenticated', { user_id: ACTOR }, async () => {
      const { answer } = await db.one('SELECT ____schema____.____method____($1) AS answer', [
        'a subject'
      ]);

      expect(answer).toBe('____name____:____method____ answered for a subject');
    });
  });

  it('falls back when the subject is blank', async () => {
    await asRole(db, 'authenticated', { user_id: ACTOR }, async () => {
      const { answer } = await db.one('SELECT ____schema____.____method____($1) AS answer', ['  ']);

      expect(answer).toBe('____name____:____method____ answered for nobody');
    });
  });
});
