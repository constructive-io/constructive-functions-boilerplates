# ____name____

____description____

```
deploy/ revert/ verify/   the feature's SQL, authored with `pgpm add`
handlers/handler.json     what it is, and what it may reach
handlers/                 its function — handlers/____method____.ts
__tests__/                the lane, end to end: no cluster, no keys, no network
```

## The lane

This is a **sync**: runtime `http` (the code is a container the platform
POSTs to, which is what lets you ship it without rebuilding the compute worker),
channel `sync` — the gateway invokes it and answers on the caller's own connection, as `{ ok, result, invocationId }`.

The image serves `POST /____method____`, the method route the platform addresses `____name____:____method____` through.

## What it may reach

`handlers/handler.json` is this feature's declaration, and it is the only place
its identity and its capabilities are written down — the platform reads that
file at deploy time and the test reads it too, so the two cannot drift.

A capability the platform did not resolve for you is not reachable: `ctx.storage`
and `ctx.secrets` throw on a key this file never declared rather than handing
back `undefined`. So declare what you use, as you write it:

```json
"requiredBuckets": ["exports"],
"requiredSecrets": [{ "name": "STRIPE_KEY", "required": true }],
"requiredConfigs": [{ "name": "EXPORT_ROW_LIMIT", "required": false }],
"requiredModules": ["notifications_module"],
"requiredModels": ["gpt-4o"]
```

Always the **logical** key, never a physical name: `ctx.storage.write('exports', …)`
resolves to this tenant's bucket per invocation, and `ctx.secrets.get('STRIPE_KEY')`
reads from this tenant's own store. Secret *values* never travel in the manifest,
the capability bundle, the payload, the logs, or the pod's environment.

## Running it

```bash
pgpm docker start --image docker.io/constructiveio/postgres-plus:18
eval "$(pgpm env)"
pnpm --filter "@constructive-functions/feature-____name____" test
```
