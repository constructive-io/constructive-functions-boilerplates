# ____name____

____description____

```
handlers/handler.json     what this feature is, and what it may reach
handlers/                 its functions — handlers/____method____.ts
package.json              its npm dependencies, like any other node package
__tests__/                behaviour, plus the manifest end to end
```

## The surface

This is a **sql** feature: it is db-connected.

`ctx.db(fn)` runs the callback in one transaction that has assumed a
low-privilege role and stamped the invocation's identity claims, so the tenant's
RLS applies to every statement — it commits on return, rolls back on throw. The
role follows the actor: `authenticated` for an invocation carrying one,
`anonymous` for one that does not. There is no pool on the context by design: a
raw pool is the worker's own privileged, RLS-exempt connection, and a handler
that opened one would be reading every tenant's rows.

Statements yes, schema no. Every table this feature reads exists because the
platform or a **seed** put it there — a feature that invents one is testing a
shape nothing in production has. A feature with no database at all is a **gql**
feature (`fun init <name> --surface gql`), whose context has no `db`.

The image serves `POST /____method____` — the method route the platform addresses
`____name____:____method____` through. A second function is a second entry in
`handlers/index.ts` and a second entry in `methods[]`; nothing else changes.

The **kind** (`job`, `sync`, `page`) is not a different template, only a different
way in: a job is enqueued and run by the worker, a sync is invoked through the
gateway on the caller's connection, a page is served at a route. It is expressed
in `handler.json` as `accessChannels` plus `route`, and `fun init --kind` fills it.

## What it may reach

`handlers/handler.json` is this feature's declaration and the only place its
identity and capabilities are written down — the platform reads it at deploy
time, and the test reads the same file, so the two cannot drift.

Anything undeclared is unreachable: `ctx.storage` and `ctx.secrets` throw on a key
this file never declared rather than answering `undefined`. Declare what you use,
as you write it:

```json
"requires": {
  "buckets": ["exports"],
  "secrets": [{ "name": "STRIPE_KEY", "required": true }],
  "configs": [{ "name": "EXPORT_ROW_LIMIT", "required": false }],
  "modules": ["notifications_module"],
  "models": ["gpt-4o"]
}
```

Always the **logical** key, never a physical name: `ctx.storage.write('exports', …)`
resolves to this tenant's bucket per invocation, and `ctx.secrets.get('STRIPE_KEY')`
reads from this tenant's own store. Secret *values* never travel in the manifest,
the capability bundle, the payload, the logs, or the pod's environment.

A `modules` entry is how a feature says which provisioned module's tables it
reads — declared, so a tenant missing it fails at deploy rather than mid-query.

npm dependencies go in `package.json`, where node already keeps them — the image
build reads that file. `handler.json` carries only what the platform reads.

## Running it

```bash
pgpm docker start --image docker.io/constructiveio/postgres-plus:18
eval "$(pgpm env)"
pnpm --filter "@constructive-functions/feature-____name____" test
```

## Next

The test above is the loop: it clones a seeded template database, needs no
cluster, and is the only thing you need while writing the handler. When you want
this feature on a real stack, from the root of the checkout it lives in:

```bash
pnpm fun up --k8s      # brings the platform up and registers every feature here
```

Registration reads `handlers/handler.json` — the same file the test reads — so a
manifest-only change needs no rebuild:

```bash
pnpm fun register --apply     # write the declaration; --dry-run prints the SQL
```

A registration failure aborts the bring-up rather than being reported as
skipped, which it once was: an unregistered method has no symptom of its own
until something calls it and gets
`No service URL for "____name____:____method____"`.

### If this is a page

A page method is `accessChannels: ["page"]` plus a `route`, and that is the whole
of it: no framework, no build step, no `pages/` directory — the handler answers
with the status, headers and body the browser gets.

A feature that serves a *site* rather than one route puts those methods in a
second manifest nested beside this one, because a page container and a JSON
container are two images:

```
handlers/handler.json          the sync/job methods         "type": "node-multi-method"
handlers/pages/handler.json    the routes a browser lands on "type": "node-page"
```

The nested manifest declares its own `image`, and the platform generates and
builds it as one. `features/auth` in constructive-functions is the reference —
one page image serving four landings, each redirecting with the tenant's session
cookie. Note that `route` and `accessChannels` are per **method**, not per
feature: `features/checkout` serves `checkout:session` at `/session` over `sync`
and `checkout:callback` at `/callback` as a page, from one feature.
