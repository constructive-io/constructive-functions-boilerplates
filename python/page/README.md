# ____name____

____description____

```
deploy/ revert/ verify/   the feature's SQL, authored with `pgpm add`
handlers/handler.json     what it is, and what it may reach
handlers/                 its function — handlers/server.py
__tests__/                the lane, end to end: no cluster, no keys, no network
```

## The lane

This is a **page**: runtime `http` (the code is a container the platform
POSTs to, which is what lets you ship it without rebuilding the compute worker),
channel `page` — a browser reaches it directly: the request is forwarded verbatim and the response goes back unwrapped, headers and status included.

The image serves ordinary routes — `____route____` — because a page is not an envelope.

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

## Next

The test above is the loop: it clones a seeded template database, needs no
cluster, and is the only thing you need while writing the handler.

When you want it on a real stack, from the repository root:

```bash
pnpm fun up --k8s     # brings the platform up and registers every feature here
```

Registration reads `handlers/handler.json` — the same file the test reads — so
a manifest change does not need a redeploy:

```bash
pnpm fun register --apply    # write the declaration; --dry-run prints the SQL
```

A registration failure is never swallowed. If `fun register` reports a problem,
nothing was registered, and calls fail later with `No service URL for "<task>"`.
Fix it before moving on.

### A page is a lane, not a UI framework

This gives you the route a browser can reach — there is no `pages/` directory
and nothing to build. Your handler returns what the browser gets: status,
headers and body, unwrapped.

If you want a server-rendered app rather than a handler, `features/auth` and
`features/sso` in constructive-functions are the reference. Their `pages/` is a
Next.js app that is generated into the image at build time rather than
committed, which is why those directories look empty in a fresh checkout.

`route` and `accessChannels` sit at the top level while this feature has one
method. A second method needs its own `route` — `features/sso` serves
`sso:start` at `/start` and `sso:callback` at `/auth/callback`.
