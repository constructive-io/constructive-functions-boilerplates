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
