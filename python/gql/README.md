# ____name____

____description____

```
handlers/handler.json     what this feature is, and what it may reach
handlers/handler.py       its functions — the image serves every public coroutine
handlers/requirements.txt its pip dependencies, like any other python project
__tests__/                the manifest, the image and the queue, end to end
```

## The surface

This is a **gql** feature, written in python: it is served over HTTP/GraphQL and
**has no database connection**. It reaches the tenant's data through the
tenant's own API, which applies the caller's permissions, and its declared
buckets, secrets and models through the rest of the context — never Postgres
directly. The handler's `ctx` is typed as a protocol that has no `db`, so a
query is a type error rather than a habit. A feature that reads the tenant's
database directly is a **sql** feature
(`fun init <name> --surface sql --lang python`).

## The python image

The image is `constructive_runtime` plus a FastAPI entry point that imports
`handlers/handler.py` and serves **every public coroutine in it** as
`POST /<name>` — the route the platform addresses `____name____:<name>` through.
So a second function is a second `async def` and a second entry in `methods[]`;
nothing else changes. A helper that must not become a route is either a plain
`def` or lives in another module.

The context is the same surface a TypeScript handler gets — `ctx.secrets`,
`ctx.storage`, `ctx.agent`, `ctx.log`, `ctx.job` — because it is the same
runtime, mirrored in python rather than reimplemented. The declared inputs are
compiled once, at generation, into the JSON Schema both languages enforce, so a
payload the node runtime would refuse is refused here too.

The **kind** (`job`, `sync`, `page`) is not a different template, only a
different way in: a job is enqueued and run by the worker, a sync is invoked
through the gateway on the caller's connection. It is expressed in `handler.json`
as `accessChannels` plus `route`, and `fun init --kind` fills it. A page is a
node image (`type: "node-page"`), so a python feature serving one puts those
methods in a node manifest beside this one.

## What it may reach

`handlers/handler.json` is this feature's declaration and the only place its
identity and capabilities are written down — the platform reads it at deploy
time, and the test reads the same file, so the two cannot drift.

Anything undeclared is unreachable: `ctx.storage` and `ctx.secrets` raise on a
key this file never declared rather than answering `None`. Declare what you use,
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

Always the **logical** key, never a physical name:
`ctx.storage.write('exports', …)` resolves to this tenant's bucket per
invocation, and `ctx.secrets.get('STRIPE_KEY')` reads from this tenant's own
store. Secret *values* never travel in the manifest, the capability bundle, the
payload, the logs, or the pod's environment.

pip dependencies go in `handlers/requirements.txt`, where python already keeps
them — the image installs it on top of the runtime's own. `handler.json` carries
only what the platform reads, and system packages belong to the Dockerfile.

## Running it

```bash
pgpm docker start --image docker.io/constructiveio/postgres-plus:18
eval "$(pgpm env)"
pnpm --filter "@constructive-functions/feature-____name____" test
```

The suite is TypeScript because the platform it drives is: it registers this
feature from `handler.json`, stages and starts the real python image, and
invokes it through the real queue. The first run builds the image's venv under
`.image/` (git-ignored) and later runs reuse it, so only the first is slow.

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
